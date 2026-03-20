export const runtime = "nodejs";
import { HallucinationDetector } from "@/lib/hallucination";
import { checkRateLimit } from "@/lib/rateLimit";
import { QualityAssurance } from "@/lib/qualityAssurance";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const OPENAI_URL    = "https://api.openai.com/v1/chat/completions";
const TIMEOUT_DEFAULT = 60_000;  // 60s
const TIMEOUT_LONG    = 120_000; // 120s for blog post generation

// ─── Anthropic (Claude) with native web_search ──────────────────
async function callAnthropic(messages, systemPrompt, maxTokens) {
  const timeout = maxTokens >= 5000 ? TIMEOUT_LONG : TIMEOUT_DEFAULT;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const headers = {
    "Content-Type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "anthropic-beta": "web-search-2025-03-05",
  };

  const tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }];
  let currentMessages = [...messages];
  let finalText = "";

  try {
    for (let i = 0; i < 12; i++) {
      const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: maxTokens,
          system: systemPrompt,
          tools,
          messages: currentMessages,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Anthropic ${res.status}: ${err}`);
      }

      const data = await res.json();
      const textBlocks = data.content.filter((b) => b.type === "text");
      if (textBlocks.length) finalText += textBlocks.map((b) => b.text).join("\n");

      // Stop if model is done
      if (data.stop_reason === "end_turn") break;

      // Handle tool use — Anthropic's web_search runs server-side,
      // we just need to push the assistant message and continue
      const toolBlocks = data.content.filter((b) => b.type === "tool_use");
      if (!toolBlocks.length) break;

      currentMessages.push({ role: "assistant", content: data.content });
      // No tool_result needed for server-side web_search — just push back and continue
    }
  } finally {
    clearTimeout(timer);
  }

  return finalText;
}

// ─── OpenAI (GPT-4o with web search) ───────────────────────────────
async function callOpenAI(messages, systemPrompt, maxTokens) {
  const timeout = maxTokens >= 5000 ? TIMEOUT_LONG : TIMEOUT_DEFAULT;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  };

  const openAIMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-search-preview",
        messages: openAIMessages,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    if (!text || text.trim().length === 0) {
      throw new Error("OpenAI returned empty response. Please try again.");
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Gemini Flash Preview ───────────────────────────────────────
async function callGemini(messages, systemPrompt, maxTokens) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`;
  const timeout = maxTokens >= 5000 ? TIMEOUT_LONG : TIMEOUT_DEFAULT;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content) }],
  }));

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text || text.trim().length === 0) {
      throw new Error("Gemini returned empty response. Please try again.");
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Route Handler ──────────────────────────────────────────────────
export async function POST(request) {
  try {
    const clientId = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitCheck = checkRateLimit(clientId, 60000, 20);

    if (!rateLimitCheck.allowed) {
      return Response.json(
        { error: rateLimitCheck.message, retryAfter: rateLimitCheck.retryAfter },
        { status: 429, headers: { "Retry-After": rateLimitCheck.retryAfter } }
      );
    }

    const { messages, systemPrompt, maxTokens, provider } = await request.json();

    if (provider === "openai") {
      if (!process.env.OPENAI_API_KEY) {
        return Response.json({ error: "OPENAI_API_KEY is not set in .env.local" }, { status: 500 });
      }
      const text = await callOpenAI(messages, systemPrompt, maxTokens || 4096);
      return Response.json({ text });
    }

    if (provider === "gemini") {
      if (!process.env.GEMINI_API_KEY) {
        return Response.json({ error: "GEMINI_API_KEY is not set in .env.local" }, { status: 500 });
      }
      const text = await callGemini(messages, systemPrompt, maxTokens || 4096);
      return Response.json({ text });
    }

    // Default: Anthropic
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "ANTHROPIC_API_KEY is not set in .env.local" }, { status: 500 });
    }
    const text = await callAnthropic(messages, systemPrompt, maxTokens || 4096);

    // Analyze response quality
    const analysis = HallucinationDetector.analyze(text);

    return Response.json({
      text,
      quality: {
        hazardScore: analysis.hazardScore,
        confidenceLevel: analysis.confidenceLevel,
        flags: analysis.flags,
        shouldRegenerate: analysis.shouldRegenerate,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("SEO API error:", err);
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
