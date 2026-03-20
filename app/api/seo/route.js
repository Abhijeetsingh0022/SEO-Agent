export const runtime = "nodejs";
import { HallucinationDetector } from "@/lib/hallucination";
import { checkRateLimit } from "@/lib/rateLimit";
import { QualityAssurance } from "@/lib/qualityAssurance";
import { KeyRotator } from "@/lib/keys";
import { SearchCache } from "@/lib/searchCache";
import { PrivacyManager } from "@/lib/dataMinimization";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const OPENAI_URL    = "https://api.openai.com/v1/chat/completions";
const TIMEOUT_DEFAULT = 60000;
const TIMEOUT_LONG = 240000;

// ─── Normalize Messages (Merge consecutive same roles for Anthropic/Claude) ─
function normalizeMessages(messages) {
  if (!messages?.length) return [];
  const normalized = [];
  for (const msg of messages) {
    const last = normalized[normalized.length - 1];
    if (last && last.role === msg.role) {
      last.content = `${last.content}\n\n${msg.content}`;
    } else {
      normalized.push({ ...msg });
    }
  }
  
  // Anthropic requires starting with a 'user' message
  if (normalized.length > 0 && normalized[0].role === 'assistant') {
    normalized.shift();
  }
  
  return normalized;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Anthropic ──────────────────────────────────────────────────
async function callAnthropic(messages, systemPrompt, maxTokens) {
  const apiKey = KeyRotator.getKey("anthropic");
  if (!apiKey) throw new Error("QUOTA_EXHAUSTED:anthropic");

  const normalized = normalizeMessages(messages);
  if (!normalized.length) throw new Error("No user messages provided to Anthropic.");

  const timeout = maxTokens >= 5000 ? TIMEOUT_LONG : TIMEOUT_DEFAULT;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const headers = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
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
        if (res.status === 429) {
          KeyRotator.markFailed(apiKey);
          throw new Error("RATE_LIMITED");
        }
        const err = await res.text();
        throw new Error(`Anthropic ${res.status}: ${err}`);
      }

      const data = await res.json();
      const textBlocks = data.content.filter((b) => b.type === "text");
      if (textBlocks.length) finalText += textBlocks.map((b) => b.text).join("\n");

      if (data.stop_reason === "end_turn") break;

      const toolBlocks = data.content.filter((b) => b.type === "tool_use");
      if (!toolBlocks.length) break;

      currentMessages.push({ role: "assistant", content: data.content });
    }
  } finally {
    clearTimeout(timer);
  }

  if (!finalText || finalText.trim().length === 0) throw new Error("Anthropic returned an empty response. Please try again.");
  return finalText;
}

// ─── OpenAI ─────────────────────────────────────────────────────
async function callOpenAI(messages, systemPrompt, maxTokens) {
  const apiKey = KeyRotator.getKey("openai");
  if (!apiKey) throw new Error("QUOTA_EXHAUSTED:openai");

  const timeout = maxTokens >= 5000 ? TIMEOUT_LONG : TIMEOUT_DEFAULT;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-search-preview",
        messages: [{ role: "system", content: systemPrompt }, ...normalizeMessages(messages)],
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        KeyRotator.markFailed(apiKey);
        throw new Error("RATE_LIMITED");
      }
      const err = await res.text();
      throw new Error(`OpenAI ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    if (!text || text.trim().length === 0) throw new Error("OpenAI returned an empty response. Please try again.");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Gemini 3 Flash Preview ──────────────────────────────────────
// NOTE: googleSearch tool removed — requires Gemini paid tier.
// The model itself still performs research based on its training.
async function callGemini(messages, systemPrompt, maxTokens) {
  const apiKey = KeyRotator.getKey("gemini");
  if (!apiKey) throw new Error("QUOTA_EXHAUSTED:gemini");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`;
  const timeout = maxTokens >= 5000 ? TIMEOUT_LONG : TIMEOUT_DEFAULT;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const normalized = normalizeMessages(messages);
  const contents = normalized.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content) }],
  }));

  try {
    const res = await fetch(`${url}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        KeyRotator.markFailed(apiKey);
        throw new Error("RATE_LIMITED");
      }
      const err = await res.text();
      throw new Error(`Gemini ${res.status}: ${err}`);
    }

    const data = await res.json();
    console.log(`[Gemini Response Raw] Data keys:`, Object.keys(data));
    
    // Check for safety blocks
    if (data.promptFeedback?.blockReason) {
      throw new Error(`Gemini blocked the prompt: ${data.promptFeedback.blockReason}. This usually happens with restricted keywords or sensitive brand comparisons.`);
    }

    const candidate = data.candidates?.[0];
    if (!candidate) throw new Error("Gemini returned no candidates. Please try again.");

    if (candidate.finishReason === "SAFETY") {
      throw new Error("Gemini blocked the response due to safety filters. Try refining your brand context.");
    }

    const text = candidate.content?.parts?.[0]?.text || "";
    if (!text || text.trim().length === 0) throw new Error("Gemini returned an empty text response. Please try again.");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

// ─── OpenRouter (Universal LLM Access) ──────────────────────────
async function callOpenRouter(messages, systemPrompt, maxTokens, modelOverride = null) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.includes('your-key-here')) throw new Error("QUOTA_EXHAUSTED:openrouter");

  const model = modelOverride || process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct:free";
  const timeout = maxTokens >= 5000 ? TIMEOUT_LONG : TIMEOUT_DEFAULT;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://seo-agent.local", // Optional, for OpenRouter rankings
        "X-Title": "SEO Agent Pro",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, ...normalizeMessages(messages)],
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("RATE_LIMITED");
      if (res.status === 404 && !modelOverride) {
        console.warn(`[OpenRouter] Primary model ${model} 404, trying fallback...`);
        return callOpenRouter(messages, systemPrompt, maxTokens, "google/gemini-2.0-flash-lite-preview-02-05:free");
      }
      const err = await res.text();
      throw new Error(`OpenRouter ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    if (!text || text.trim().length === 0) throw new Error("OpenRouter returned an empty response. Please try again.");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

const CALLER_MAP = {
  openai: callOpenAI,
  gemini: callGemini,
  anthropic: callAnthropic,
  openrouter: callOpenRouter,
};

// ─── Retry with backoff ──────────────────────────────────────────
async function callWithRetry(provider, messages, systemPrompt, maxTokens) {
  const totalKeys = Math.max(1, KeyRotator.countKeys(provider));
  const maxAttempts = Math.min(totalKeys, 5); 
  const caller = CALLER_MAP[provider] || callAnthropic;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await caller(messages, systemPrompt, maxTokens);
    } catch (err) {
      // If rate limited and we have more keys to try, rotate immediately
      if ((err.message === "RATE_LIMITED" || err.message?.includes("429")) && attempt < maxAttempts) {
        console.warn(`[${provider}] Key ${attempt}/${totalKeys} rate limited. Rotating to next key immediately...`);
        // No sleep needed here because we are rotating to a fresh key
        continue;
      }
      throw err;
    }
  }
}

// ─── Route Handler ───────────────────────────────────────────────
export async function POST(request) {
  let provider = "anthropic";
  try {
    const clientId = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitCheck = checkRateLimit(clientId, 60000, 30);

    if (!rateLimitCheck.allowed) {
      console.log(`[API Result] Rate Limit Exceeded for ${clientId}`);
      return Response.json(
        { error: rateLimitCheck.message, retryAfter: rateLimitCheck.retryAfter },
        { status: 429, headers: { "Retry-After": rateLimitCheck.retryAfter } }
      );
    }

    const body = await request.json();
    provider = body.provider || provider;
    let { messages, systemPrompt, maxTokens, noCache, _salt } = body;
    console.log(`[API] Request: ${provider} | Messages: ${messages?.length} | noCache: ${noCache} | Salt: ${_salt}`);

    // ── Privacy: scrub PII ──────────────────────────────────────
    messages = (messages || []).map(m => ({
      ...m,
      content: PrivacyManager.scrubPII(m.content)
    }));
    systemPrompt = PrivacyManager.scrubPII(systemPrompt);

    // ── Cache Check ─────────────────────────────────────────────
    const userMessages = messages.filter(m => m.role === "user");
    const firstUserMsg = userMessages[0]?.content || "";
    const lastUserMsg  = userMessages[userMessages.length - 1]?.content || "";
    
    const cached = noCache ? null : SearchCache.get(provider, firstUserMsg, lastUserMsg);
    if (cached && typeof cached === 'string' && cached.trim().length > 0) {
      console.log(`[API Result] Cache Hit: "${cached.slice(0, 50)}..."`);
      return Response.json({ text: cached, cached: true }, { headers: { "Cache-Control": "no-store" } });
    }

    // ── Call with retry ─────────────────────────────────────────
    let text;
    try {
      text = await callWithRetry(provider || "anthropic", messages, systemPrompt, maxTokens || 4096);
      console.log(`[API Result] AI Success: "${text?.slice(0, 50)}..."`);
    } catch (err) {
      console.error(`[API Result] AI Error: ${err.message}`);

      // SELF-HEALING FALLBACK: If current provider is 429 or 404, try others
      const isExhausted = err.message === "RATE_LIMITED" || err.message?.startsWith("QUOTA_EXHAUSTED") || err.message?.includes("404") || err.message?.includes("429");
      
      if (isExhausted) {
        const fallbacks = ["gemini", "anthropic", "openai", "openrouter"].filter(p => p !== provider);
        for (const fb of fallbacks) {
          if (KeyRotator.getKey(fb) || (fb === "openrouter" && process.env.OPENROUTER_API_KEY)) {
            console.log(`[Self-Healing] ${provider} failed (${err.message}). Trying fallback provider: ${fb}...`);
            try {
              if (fb === "gemini") text = await callGemini(messages, systemPrompt, maxTokens || 1000);
              else if (fb === "anthropic") text = await callAnthropic(messages, systemPrompt, maxTokens || 1000);
              else if (fb === "openai") text = await callOpenAI(messages, systemPrompt, maxTokens || 1000);
              else if (fb === "openrouter") text = await callOpenRouter(messages, systemPrompt, maxTokens || 1000);
              
              if (text) {
                console.log(`[Self-Healing Result] ${fb} Success: "${text?.slice(0, 50)}..."`);
                break; // Exit fallback loop on success
              }
            } catch (fbErr) {
              console.warn(`[Self-Healing] ${fb} also failed. Moving to next...`);
            }
          }
        }
      }

      if (!text) throw err; // Re-throw if no fallback worked
    }

    // ── Cache Result ─────────────────────────────────────────────
    if (text && text.length > 100) {
      SearchCache.set(provider, firstUserMsg, lastUserMsg, text);
    }

    const analysis = HallucinationDetector.analyze(text);
    console.log(`[API Result] Final Response: "${text?.slice(0, 50)}..."`);
    return Response.json({
      text,
      quality: {
        hazardScore: analysis.hazardScore,
        confidenceLevel: analysis.confidenceLevel,
        flags: analysis.flags,
        shouldRegenerate: analysis.shouldRegenerate,
      },
      timestamp: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });

  } catch (err) {
    console.error(`[API Final Catch] JSON Error:`, err.message);
    if (err.message === "RATE_LIMITED" || err.message?.startsWith("QUOTA_EXHAUSTED")) {
      const totalKeys = KeyRotator.countKeys(provider || "anthropic");
      return Response.json({ 
        error: `All ${totalKeys} keys for ${provider} are temporarily rate limited. We also tried fallback providers. Please wait 60 seconds or switch models.` 
      }, { status: 429, headers: { "Cache-Control": "no-store" } });
    }
    if (err.message?.includes("OpenRouter 404")) {
      return Response.json({ error: "Background analysis model unavailable. Please check your OpenRouter settings or try again." }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    return Response.json({ error: err.message || "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
