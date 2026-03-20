"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { QualityAssurance } from "@/lib/qualityAssurance";
import {
  STEPS,
  SYSTEM_PROMPT,
  PROMPT_STEP1,
  PROMPT_STEP2,
  PROMPT_STEP3,
  PROMPT_STEP4,
  PROMPT_STEP5,
  PROMPT_STEP6,
  PROMPT_STEP7,
} from "@/lib/constants";

const STORAGE_KEY = "seo-agent-session";
const MAX_HISTORY_TOKENS = 8000; // ~6000 words before we summarize

// ─── Summarize earlier steps to keep token usage under control ────
function buildSummarizedHistory(fullHistory) {
  // Simple token estimate: average 4 chars per token
  const totalChars = fullHistory.reduce((n, m) => n + String(m.content).length, 0);
  if (totalChars / 4 < MAX_HISTORY_TOKENS) return fullHistory;

  // Keep last 2 messages verbatim; summarize the rest into one context message
  const recent = fullHistory.slice(-4);
  const earlier = fullHistory.slice(0, -4);
  const summarized = earlier
    .filter((m) => m.role === "assistant")
    .map((m, i) => `[Step ${i + 1} summary]: ${String(m.content).slice(0, 800)}…`)
    .join("\n\n");

  return [
    {
      role: "user",
      content: `Context from earlier research steps:\n${summarized}\n\nContinue from here.`,
    },
    ...recent,
  ];
}

async function callAPI(messages, systemPrompt, maxTokens, provider, noCache = false) {
  const res = await fetch("/api/seo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: buildSummarizedHistory(messages),
      systemPrompt,
      maxTokens,
      provider,
      noCache,
      _salt: Math.random().toString(36).substring(7),
    }),
  });

  if (!res.ok) {
    let errText;
    try { errText = await res.text(); } catch { errText = `HTTP ${res.status}`; }
    console.error(`[API Call Failed] URL: /api/seo | Status: ${res.status} | Error: ${errText}`);
    throw new Error(`API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  console.log(`[API Call Success] URL: /api/seo | Length: ${data.text?.length || 0}`);
  if (data.error) throw new Error(data.error);
  if (!data.text) throw new Error("Empty response from server. Please try again.");
  return data;
}

// ─── LocalStorage helpers ─────────────────────────────────────────
function saveSession(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      url: state.url,
      siteUrl: state.siteUrl,
      phase: state.phase,
      stepData: state.stepData,
      conversation: state.conversation,
      provider: state.provider,
      savedAt: Date.now(),
    }));
  } catch { /* ignore quota errors */ }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Expire sessions older than 24 hours
    if (Date.now() - data.savedAt > 86_400_000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

function clearSession() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
}

export function useSEOWorkflow() {
  const [provider, setProvider] = useState("gemini");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [phase, setPhase] = useState("idle");
  const [siteUrl, setSiteUrl] = useState("");
  const [stepData, setStepData] = useState({});
  const [hasSession, setHasSession] = useState(false);

  // Advanced Brand Context
  const [businessCategory, setBusinessCategory] = useState("");
  const [keyProducts, setKeyProducts] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  // Internal Background Intelligence
  const [internalData, setInternalData] = useState({
    radar: null,
    velocity: 0,
    rankings: [],
  });
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);

  const conversationRef = useRef([]);
  const bottomRef = useRef(null);
  const stepInputsRef = useRef({});

  // ── Auto-scroll ─────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [stepData]);

  // ── Reactive Workflow Chain ─────────────────────────────────
  useEffect(() => {
    if (phase !== "running") return;

    // Phase 2 (Competitors) -> Start after Step 1 is done
    if (stepData[1]?.status === 'done' && !stepData[2]) {
      runStep2();
    }
    // Phase 3 (Topics) -> Start after Step 2 is done
    if (stepData[2]?.status === 'done' && !stepData[3]) {
      runStep3();
    }
    // Phase 7 (SEO Optimization) -> Start after Step 6 is done
    if (stepData[6]?.status === 'done' && !stepData[7]) {
      runStep7();
    }
  }, [stepData, phase]);

  // ── Load saved session on mount ──────────────────────────────
  useEffect(() => {
    const session = loadSession();
    if (session && session.phase !== "idle") {
      setHasSession(true);
    }
  }, []);

  function patchStep(id, patch) {
    setStepData((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), ...patch } };
      return next;
    });
  }

  // Save session whenever stepData changes
  useEffect(() => {
    if (phase !== "idle") {
      saveSession({
        url, siteUrl, phase,
        stepData,
        conversation: conversationRef.current,
        provider,
        businessCategory,
        keyProducts,
        targetAudience,
      });
    }
  }, [stepData, phase, url, siteUrl, provider, businessCategory, keyProducts, targetAudience]);

  function restoreSession() {
    const session = loadSession();
    if (!session) return;
    setUrl(session.url || "");
    setSiteUrl(session.siteUrl || "");
    setPhase(session.phase || "idle");
    setStepData(session.stepData || {});
    setProvider(session.provider || "anthropic");
    conversationRef.current = session.conversation || [];
    setHasSession(false);

    // AUTO-RESUME: If we were in the middle of automated steps, pick up where we left off
    if (session.phase === "running") {
      const lastDone = Math.max(0, ...Object.entries(session.stepData)
        .filter(([_, d]) => d.status === "done")
        .map(([id]) => parseInt(id)));

      if (lastDone < 7) {
        resumeWorkflow(session.siteUrl, lastDone);
      }
    }
  }

  async function resumeWorkflow(targetUrl, lastDone) {
    // Wait a moment for state to settle
    await new Promise(r => setTimeout(r, 800));

    // Jump to the next step that needs running
    if (lastDone === 0) runWorkflow(targetUrl);
    else if (lastDone === 1) runStep2();
    else if (lastDone === 2) runStep3();
    else if (lastDone === 3) { /* Step 4 starts from Step 3 Gate */ }
    else if (lastDone === 4) { /* Step 5 starts from Step 4 Gate */ }
    else if (lastDone === 5) { /* Step 6 starts from Step 5 Gate */ }
    else if (lastDone === 6) runStep7();
  }

  function dismissSession() {
    clearSession();
    setHasSession(false);
  }

  async function callSEO(userMessage, maxTokens = 4096, noCache = false) {
    conversationRef.current.push({ role: "user", content: userMessage });
    try {
      const data = await callAPI(conversationRef.current, SYSTEM_PROMPT, maxTokens, provider, noCache);
      conversationRef.current.push({ role: "assistant", content: data.text });
      return data;
    } catch (e) {
      // Roll back the latest user message if it failed, so we don't end up with consecutive user messages
      conversationRef.current.pop();
      throw e;
    }
  }


  // ── Production Hub: Generate 50+ Variations (Mocked at 3 for UI stability) ──
  async function generateVariations() {
    const mainContent = stepData[6]?.text;
    if (!mainContent) return;

    setIsGeneratingVariations(true);
    try {
      const prompt = `Based on this article, generate 3 professional content variations in a JSON object: 
      1. "social": A Twitter/LinkedIn snippet.
      2. "email": A short promo email body.
      3. "recap": A 2-sentence TL;DR.
      Content: ${mainContent.slice(0, 3000)}…`;

      const res = await callAPI([{ role: "user", content: prompt }], "Always respond with STRICT JSON ONLY. Ensure the object has 'social', 'email', and 'recap' keys.", 1500, "openrouter");
      const json = JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] || res.text);
      setInternalData(prev => ({ ...prev, variations: json }));
    } catch (e) {
      console.error("Failed to generate variations:", e);
    } finally {
      setIsGeneratingVariations(false);
    }
  }

  // ── Retry mechanism ──────────────────────────────────────────
  async function retryStep(stepId) {
    const inputs = stepInputsRef.current[stepId];
    if (!inputs) return;
    patchStep(stepId, { status: "loading", error: null });
    try {
      let result;
      switch (stepId) {
        case 1: result = await callSEO(inputs.url, 4096, true); break;
        case 2: result = await callSEO(PROMPT_STEP2(), 4096, true); break;
        case 3: result = await callSEO(PROMPT_STEP3(), 4096, true); break;
        case 4: result = await callSEO(PROMPT_STEP4(inputs.topic), 4096, true); break;
        case 5: result = await callSEO(PROMPT_STEP5(inputs.topic, inputs.kwNote), 4096, true); break;
        case 6: result = await callSEO(PROMPT_STEP6(inputs.topic, inputs.outNote), 6000, true); break;
        case 7: result = await callSEO(PROMPT_STEP7(), 4096, true); break;
        default: return;
      }
      patchStep(stepId, { status: "done", text: result.text, canRetry: false });
    } catch (e) {
      patchStep(stepId, { status: "error", error: e.message, canRetry: true });
    }
  }

  // Helper to extract keywords from Step 4 text
  function extractKeywords(text) {
    if (!text) return [];
    // More flexible regex: matches "1. **Keyword**", "1. Keyword", and "Target Keyword: Keyword"
    const matches = text.match(/(?:\d+\.\s+|\*\*|Target Keyword[:\s]+)\*{0,2}(.*?)(?:\*\*|:|\n|$)/gi) || [];
    return matches
      .map(m => m.replace(/^(?:\d+\.\s+|\*\*|Target Keyword[:\s]+)\*{0,2}/i, '').replace(/\*+$/, '').trim())
      .filter(t => t.length > 2 && t.length < 100 && !t.toLowerCase().includes('intent') && !t.toLowerCase().includes('potential'))
      .slice(0, 10);
  }

  // Helper to extract suggestions for the next step's gate
  function extractSuggestionsForNextStep(text, stepId) {
    if (!text) return [];
    try {
      if (stepId === 2) {
        // From Competitor Analysis, extract 3 topic gaps
        const gaps = text.match(/Gap \d+: (.*?)(?:\n|$)/gi) || [];
        return gaps.map(g => g.replace(/Gap \d+: /i, '').split(':')[0].trim()).slice(0, 3);
      }
      if (stepId === 4) {
        // From Keyword Research, extract top 3 keywords – Flexible matching
        const kws = text.match(/(?:\d+\.\s+|\*\*|Target Keyword[:\s]+)\*{0,2}(.*?)(?:\*\*|:|\n|$)/gi) || [];
        return kws
          .map(k => k.replace(/^(?:\d+\.\s+|\*\*|Target Keyword[:\s]+)\*{0,2}/i, '').replace(/\*+$/, '').trim())
          .filter(t => t.length > 2 && !t.toLowerCase().includes('intent'))
          .slice(0, 3);
      }
      return [];
    } catch { return []; }
  }

  // ── Steps 1 → 2 → 3 ─────────────────────────────────────────
  async function runWorkflow(rawUrl, context = {}) {
    console.log(`[Workflow Start] URL: ${rawUrl} | Context:`, context);
    const targetUrl = rawUrl?.trim();
    stepInputsRef.current[1] = { url: targetUrl, ...context };
    patchStep(1, { status: "loading" });
    try {
      const d1 = await callSEO(PROMPT_STEP1(targetUrl, context));
      patchStep(1, { status: "done", text: d1.text, canRetry: false });
    } catch (e) {
      patchStep(1, { status: "error", error: e.message, canRetry: true });
    }
  }

  async function runStep2() {
    stepInputsRef.current[2] = {};
    patchStep(2, { status: "loading" });
    try {
      // Fetch Live Competitors via SERP API
      const serpRes = await fetch("/api/serp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `top organic search competitors for ${siteUrl}` }),
      }).then(res => res.json()).catch(() => null);

      const serpDataStr = serpRes && !serpRes.error ? JSON.stringify(serpRes.results || serpRes) : "";
      const d2 = await callSEO(PROMPT_STEP2(serpDataStr));
      patchStep(2, { status: "done", text: d2.text, canRetry: false });
    } catch (e) {
      patchStep(2, { status: "error", error: e.message, canRetry: true });
    }
  }

  async function runStep3() {
    stepInputsRef.current[3] = {};
    patchStep(3, { status: "loading" });
    try {
      const rivalsData = stepData[2]?.serpData?.organic || [];
      const rivalsStr = rivalsData.map(r => `${r.title} (${r.link})`).join(", ");

      const d3 = await callSEO(PROMPT_STEP3(rivalsStr));
      patchStep(3, {
        status: "waiting",
        text: d3.text,
        canRetry: false,
        gate: {
          type: "topic-select",
          prompt: "Which topic would you like to proceed with?",
          hint: "Click a topic card below, or type a number (1–10). Low competition topics rank fastest.",
          placeholder: "e.g. 3 or paste the topic title…",
          onSubmit: runStep4,
        },
      });
    } catch (e) {
      patchStep(3, { status: "error", error: e.message, canRetry: true });
    }
  }

  // ── Step 4 ───────────────────────────────────────────────────
  async function runStep4(topicChoice) {
    stepInputsRef.current[4] = { topic: topicChoice };
    patchStep(3, { gate: null, status: "done" });
    patchStep(4, { status: "loading" });
    try {
      // Run SERP Analysis and Keyword Research SEO Call in parallel
      const [d4, serpRes] = await Promise.all([
        callSEO(PROMPT_STEP4(topicChoice)),
        fetch("/api/serp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: topicChoice }),
        }).then(res => res.json()).catch(() => null)
      ]);

      const keywords = extractKeywords(d4.text);
      if (keywords.length > 0) {
        checkRankings(siteUrl, keywords);
      }

      patchStep(4, {
        status: "waiting",
        text: d4.text,
        serpData: serpRes && !serpRes.error ? serpRes : null,
        canRetry: false,
        gate: {
          type: "text",
          prompt: "Proceed with these keywords, or modify them?",
          hint: "Type 'proceed' to continue, or describe modifications.",
          placeholder: "proceed, or describe changes…",
          onSubmit: (ans) => runStep5(topicChoice, ans),
        },
      });
    } catch (e) {
      patchStep(4, { status: "error", error: e.message, canRetry: true });
    }
  }

  // ── Step 5 ───────────────────────────────────────────────────
  async function runStep5(topicChoice, keywordAnswer) {
    patchStep(4, { gate: null, status: "done" });
    const kwNote =
      keywordAnswer.toLowerCase() !== "proceed" && keywordAnswer.toLowerCase() !== "yes"
        ? `\n\nNote: The user requested keyword modifications: "${keywordAnswer}". Please adjust accordingly.`
        : "";
    stepInputsRef.current[5] = { topic: topicChoice, kwNote };
    patchStep(5, { status: "loading" });
    try {
      const d5 = await callSEO(PROMPT_STEP5(topicChoice, kwNote));
      patchStep(5, {
        status: "waiting",
        text: d5.text,
        canRetry: false,
        gate: {
          type: "text",
          prompt: "Approve this outline to generate the full blog post?",
          hint: "Type 'approve' to continue, or describe any changes.",
          placeholder: "approve, or describe changes…",
          onSubmit: (ans) => runStep6(topicChoice, ans),
        },
      });
    } catch (e) {
      patchStep(5, { status: "error", error: e.message, canRetry: true });
    }
  }

  // ── Step 6 + 7 ───────────────────────────────────────────────
  async function runStep6(topicChoice, outlineAnswer) {
    patchStep(5, { gate: null, status: "done" });
    const outNote =
      outlineAnswer.toLowerCase() !== "approve" && outlineAnswer.toLowerCase() !== "yes"
        ? `\n\nNote: Outline changes requested: "${outlineAnswer}". Please incorporate.`
        : "";
    stepInputsRef.current[6] = { topic: topicChoice, outNote };
    patchStep(6, { status: "loading" });
    try {
      const d6 = await callSEO(PROMPT_STEP6(topicChoice, outNote), 6000);
      patchStep(6, { status: "done", text: d6.text, canRetry: false });

      // Quality check
      try {
        const qualityCheck = QualityAssurance.validateStep(6, d6.text);
        patchStep(6, { quality: qualityCheck });
        if (qualityCheck.qualityScore < 70) {
          console.warn("⚠️ Blog quality below standard:", qualityCheck.qualityScore + "%");
        }
      } catch (err) {
        console.log("Quality check skipped:", err.message);
      }

    } catch (e) {
      patchStep(6, { status: "error", error: e.message, canRetry: true });
    }
  }

  // ── Step 7 ───────────────────────────────────────────────────
  async function runStep7() {
    stepInputsRef.current[7] = {};
    patchStep(7, { status: "loading" });
    try {
      const d7 = await callSEO(PROMPT_STEP7());
      patchStep(7, { status: "done", text: d7.text, canRetry: false });
      setPhase("done");
      clearSession(); // Clean up on successful completion
    } catch (e) {
      patchStep(7, { status: "error", error: e.message, canRetry: true });
    }
  }

  // ── Rank Tracker logic ──────────────────────────────────────
  async function checkRankings(targetUrl, keywords = []) {
    if (!targetUrl || !keywords.length) return;
    const results = [];
    // Only track top 3 for performance in this demo
    for (const kw of keywords.slice(0, 3)) {
      try {
        const res = await fetch("/api/serp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: kw }),
        }).then(r => r.json());

        let hostname = targetUrl;
        try { hostname = new URL(targetUrl).hostname; } catch { /* fallback to raw string */ }

        const pos = res.organic?.find(o => o.link.includes(hostname))?.position || "100+";
        results.push({ keyword: kw, position: pos, change: 0 });
      } catch (e) {
        console.warn(`Rank check failed for ${kw}:`, e.message);
      }
    }
    setInternalData(prev => ({ ...prev, rankings: results }));
  }

  // ── Centralized Gate Submission ──────────────────────────────
  // This avoids losing 'onSubmit' functions when serializing to LocalStorage
  const handleGateSubmit = useCallback((stepId, value) => {
    const topic = stepInputsRef.current[4]?.topic;

    switch (stepId) {
      case 3: runStep4(value); break;
      case 4: runStep5(topic, value); break;
      case 5: runStep6(topic, value); break;
      default: console.warn("No gate handler for step", stepId);
    }
  }, [stepData, siteUrl]); // topic is in a ref, but we might want to trigger on siteUrl/stepData changes

  // ── start/reset ──────────────────────────────────────────────
  function start() {
    if (!url.trim()) return;
    let clean = url.trim();
    setUrlError("");
    try {
      let urlObj = new URL(clean);
      if (!["http:", "https:"].includes(urlObj.protocol)) throw new Error("Invalid protocol");
      if (clean.length > 2048) throw new Error("URL too long");
      clean = urlObj.href;
    } catch {
      try {
        if (!clean.startsWith("http")) clean = "https://" + clean;
        new URL(clean);
      } catch {
        setUrlError("Invalid URL format. Please enter a valid website URL.");
        return;
      }
    }
    conversationRef.current = [];
    setStepData({});
    setSiteUrl(clean);
    setPhase("running");
    runWorkflow(clean, {
      category: businessCategory,
      products: keyProducts,
      audience: targetAudience
    });
  }

  function reset() {
    setPhase("idle");
    setUrl("");
    setUrlError("");
    setSiteUrl("");
    setStepData({});
    setBusinessCategory("");
    setKeyProducts("");
    setTargetAudience("");
    conversationRef.current = [];
    clearSession();
    setHasSession(false);
  }

  const renderedSteps = STEPS.filter((s) => stepData[s.id]);
  const allDone = STEPS.every((s) => stepData[s.id]?.status === "done");
  const doneCount = STEPS.filter((s) => stepData[s.id]?.status === "done").length;
  const progressPct = Math.round((doneCount / STEPS.length) * 100);

  // Calculate active step for the sidebar highlight
  const activeStepId = useMemo(() => {
    // Check for any step currently 'loading' or 'waiting'
    const current = STEPS.find(s => stepData[s.id]?.status === 'loading' || stepData[s.id]?.status === 'waiting');
    if (current) return current.id;

    // Otherwise, find the last 'done' step and highlight the next one
    const doneSteps = STEPS.filter(s => stepData[s.id]?.status === 'done');
    if (doneSteps.length === 0) return 1;
    const lastDoneId = Math.max(...doneSteps.map(s => s.id));
    return STEPS.find(s => s.id === lastDoneId + 1)?.id || lastDoneId;
  }, [stepData]);

  return {
    url, setUrl,
    urlError,
    provider, setProvider,
    phase, siteUrl,
    stepData, renderedSteps, allDone,
    start, reset, retryStep, handleGateSubmit,
    bottomRef,
    steps: STEPS,
    hasSession, restoreSession, dismissSession,
    progressPct,
    activeStepId,
    businessCategory, setBusinessCategory,
    keyProducts, setKeyProducts,
    targetAudience, setTargetAudience,
    internalData,
  };
}
