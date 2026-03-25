"use client";

import {
  useState, useRef, useEffect,
  useCallback, useMemo, useReducer,
} from "react";
import { QualityAssurance } from "@/lib/qualityAssurance";
import {
  STEPS, SYSTEM_PROMPT,
  PROMPT_STEP1, PROMPT_STEP2, PROMPT_STEP3,
  PROMPT_STEP4, PROMPT_STEP5, PROMPT_STEP6, PROMPT_STEP7,
} from "@/lib/constants";

// ─── Step Reducer ─────────────────────────────────────────────────
function stepReducer(state, action) {
  switch (action.type) {
    case "PATCH":
      return { ...state, [action.id]: { ...(state[action.id] ?? {}), ...action.patch } };
    case "RESET":
      return {};
    default:
      return state;
  }
}

// ─── Constants ────────────────────────────────────────────────────
const STORAGE_KEY    = "seo-agent-session";
const MAX_HISTORY_TOKENS = 8000;
const SESSION_TTL_MS = 86_400_000; // 24 hours

// ─── Pure Helpers ─────────────────────────────────────────────────
function buildSummarizedHistory(history) {
  const totalChars = history.reduce((n, m) => n + String(m.content).length, 0);
  if (totalChars / 4 < MAX_HISTORY_TOKENS) return history;

  const recent   = history.slice(-4);
  const earlier  = history.slice(0, -4);
  const summary  = earlier
    .filter(m => m.role === "assistant")
    .map((m, i) => `[Step ${i + 1} summary]: ${String(m.content).slice(0, 800)}…`)
    .join("\n\n");

  return [
    { role: "user", content: `Context from earlier steps:\n${summary}\n\nContinue from here.` },
    ...recent,
  ];
}

async function callAPI(
  messages,
  systemPrompt,
  maxTokens,
  provider,
  noCache = false
) {
  const res = await fetch("/api/seo", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({
      messages: buildSummarizedHistory(messages),
      systemPrompt, maxTokens, provider, noCache,
      _salt: Math.random().toString(36).substring(7),
    }),
  });

  if (!res.ok) {
    let errText;
    try { errText = await res.text(); } catch { errText = `HTTP ${res.status}`; }
    throw new Error(`API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  if (data.error)  throw new Error(data.error);
  if (!data.text)  throw new Error("Empty response from server. Please try again.");
  return data;
}

async function fetchSERP(query, options = {}) {
  try {
    const res  = await fetch("/api/serp", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ query, ...options }),
    });
    const data = await res.json();
    return data.error ? null : data;
  } catch { return null; }
}

// ─── Session Helpers ──────────────────────────────────────────────
function saveSession(payload) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, savedAt: Date.now() })); }
  catch { /* quota errors are non-fatal */ }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.savedAt > SESSION_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

function clearSession() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
}

// ─── Keyword Extraction ───────────────────────────────────────────
function extractKeywords(text) {
  if (!text) return [];

  const isValid = (kw) => {
    if (!kw || kw.length < 4 || kw.length > 120) return false;
    if (/^(high|med|medium|low|yes|no)$/i.test(kw))  return false;
    if (/^\d{1,3}$/.test(kw))                        return false;
    if (/problem.aware|solution.aware|informational|navigational|transactional|commercial/i.test(kw)) return false;
    if (/^(\*\*|##|--|\[|\()/.test(kw))              return false;
    if (!/[a-zA-Z]{2,}/.test(kw))                    return false;
    return true;
  };

  // Strategy 1: **Target Keyword:** value
  const bold = Array.from(text.matchAll(/\*\*\s*Target Keyword\s*:\s*\*\*\s*(.+)/gi));
  if (bold.length > 0) {
    const r = bold.map(m => m[1].replace(/\*\*/g, "").trim()).filter(isValid).slice(0, 10);
    if (r.length >= 3) return r;
  }

  // Strategy 2: Target Keyword: value  (plain)
  const plain = Array.from(text.matchAll(/^\s*(?:\d+\.\s*)?Target Keyword\s*:\s*(.+)$/gim));
  if (plain.length > 0) {
    const r = plain.map(m => m[1].replace(/\*\*/g, "").trim()).filter(isValid).slice(0, 10);
    if (r.length >= 3) return r;
  }

  // Strategy 3: Numbered multi-word items
  const numbered = Array.from(text.matchAll(/^\s*\d+\.\s+\*{0,2}([^\n*:]{8,80})\*{0,2}\s*$/gim));
  if (numbered.length > 0) {
    const r = numbered
      .map(m => m[1].trim())
      .filter(isValid)
      .filter(kw => kw.split(/\s+/).length >= 2)
      .slice(0, 10);
    if (r.length >= 3) return r;
  }

  return [];
}

// ─── Topic Resolver ───────────────────────────────────────────────
function resolveTopicChoice(choice, step3Text) {
  if (!/^\s*([Tt]opic\s*)?\d+\s*$/i.test(choice) || !step3Text) return choice;

  const numMatch = choice.match(/\d+/);
  if (!numMatch) return choice;
  const num = numMatch[0];
  const lines = step3Text.split("\n");

  for (const line of lines) {
    if (new RegExp(`^\\s*\\**${num}[\\.\\):]`, "i").test(line) && line.length > 5) {
      const resolved = line
        .replace(/^\s*\**\d+[\.\):]?\**\s*/, "")
        .replace(/###/g, "")
        .replace(/\[Number\]/g, "")
        .replace(/\*\*SEO Title(?:[:\-—])?\**\s*/i, "")
        .replace(/\*\*/g, "")
        .split(/[-—:]/)[0]
        .trim();
      return resolved.length >= 5 ? resolved : choice;
    }
  }
  return choice;
}

// ─── Main Hook ────────────────────────────────────────────────────
export function useSEOWorkflow() {

  // ── Core State ──────────────────────────────────────────────
  const [provider,    setProvider]   = useState("gemini");
  const [url,         setUrl]        = useState("");
  const [urlError,    setUrlError]   = useState("");
  const [phase,       setPhase]      = useState("idle");
  const [siteUrl,     setSiteUrl]    = useState("");
  const [stepData,    dispatchStep]  = useReducer(stepReducer, {});
  const [hasSession,  setHasSession] = useState(false);
  const [brandContext, setBrandContextState] = useState({
    category: "", products: "", audience: "",
  });
  const [internalData, setInternalData] = useState({
    radar: null, velocity: 0, rankings: [],
  });
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);

  // ── Stable Refs ──────────────────────────────────────────────
  const conversationRef  = useRef([]);
  const stepInputsRef    = useRef({});
  const bottomRef        = useRef(null);

  // Shadow refs — keep latest values accessible inside stable callbacks
  const siteUrlRef      = useRef(siteUrl);
  const stepDataRef     = useRef(stepData);
  const providerRef     = useRef(provider);
  const brandContextRef = useRef(brandContext);

  useEffect(() => { siteUrlRef.current      = siteUrl;       }, [siteUrl]);
  useEffect(() => { stepDataRef.current     = stepData;      }, [stepData]);
  useEffect(() => { providerRef.current     = provider;      }, [provider]);
  useEffect(() => { brandContextRef.current = brandContext;  }, [brandContext]);

  // ── Atomic Step Patch ────────────────────────────────────────
  const patchStep = useCallback((id, patch) => {
    dispatchStep({ type: "PATCH", id, patch });
  }, []);

  const setBrandContext = useCallback(
    (field, value) =>
      setBrandContextState(prev => ({ ...prev, [field]: value })),
    []
  );

  // ── Auto-scroll ──────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [stepData]);

  // ── Session Persistence ──────────────────────────────────────
  useEffect(() => {
    if (phase === "idle") return;
    saveSession({ url, siteUrl, phase, stepData, conversation: conversationRef.current, provider, brandContext });
  }, [stepData, phase, url, siteUrl, provider, brandContext]);

  // ── Load Session Flag on Mount ───────────────────────────────
  useEffect(() => {
    const session = loadSession();
    if (session?.phase && session.phase !== "idle") setHasSession(true);
  }, []);

  // ── Core AI Call ─────────────────────────────────────────────
  const callSEO = useCallback(
    async (userMessage, maxTokens = 4096, noCache = false) => {
      conversationRef.current.push({ role: "user", content: userMessage });
      try {
        const data = await callAPI(
          conversationRef.current, SYSTEM_PROMPT,
          maxTokens, providerRef.current, noCache
        );
        conversationRef.current.push({ role: "assistant", content: data.text });
        return data;
      } catch (e) {
        conversationRef.current.pop(); // rollback on failure to prevent broken turn pairs
        throw e;
      }
    },
    [] // stable — reads provider via ref
  );

  // ── Rank Checker ─────────────────────────────────────────────
  const checkRankings = useCallback(async (targetUrl, keywords) => {
    if (!targetUrl || !keywords.length) return;
    let hostname = targetUrl;
    try { hostname = new URL(targetUrl).hostname; } catch { /* fallback */ }

    const settled = await Promise.allSettled(
      keywords.slice(0, 3).map(async (kw) => {
        const res = await fetchSERP(kw);
        const position = res?.organic?.find(
          (o) => o.link.includes(hostname)
        )?.position ?? "100+";
        return { keyword: kw, position, change: 0 };
      })
    );

    const rankings = settled
      .filter((r) => r.status === "fulfilled")
      .map(r => r.value);

    setInternalData(prev => ({ ...prev, rankings }));
  }, []);

  // ── Content Variations ───────────────────────────────────────
  const generateVariations = useCallback(async () => {
    const mainContent = stepDataRef.current[6]?.text;
    if (!mainContent) return;
    setIsGeneratingVariations(true);
    try {
      const prompt = `Based on this article, generate 3 professional content variations as a JSON object:
1. "social": A Twitter/LinkedIn snippet.
2. "email": A short promo email body.
3. "recap": A 2-sentence TL;DR.
Content: ${mainContent.slice(0, 3000)}…`;

      const res  = await callAPI(
        [{ role: "user", content: prompt }],
        `Always respond with STRICT JSON ONLY. Keys required: 'social', 'email', 'recap'.`,
        1500, "openrouter"
      );
      const json = JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] ?? res.text);
      setInternalData(prev => ({ ...prev, variations: json }));
    } catch (e) {
      console.error("[Variations] Failed:", e);
    } finally {
      setIsGeneratingVariations(false);
    }
  }, []);

  // ── Step 7 ───────────────────────────────────────────────────
  const runStep7 = useCallback(async () => {
    stepInputsRef.current[7] = {};
    patchStep(7, { status: "loading" });
    try {
      const d7 = await callSEO(PROMPT_STEP7());
      patchStep(7, { status: "done", text: d7.text, canRetry: false });
      setPhase("done");
      clearSession();
    } catch (e) {
      patchStep(7, { status: "error", error: e.message, canRetry: true });
    }
  }, [callSEO, patchStep]);

  // ── Step 6 ───────────────────────────────────────────────────
  const runStep6 = useCallback(async (topicChoice, outlineAnswer) => {
    patchStep(5, { gate: null, status: "done" });
    const outNote = !["approve", "yes"].includes(outlineAnswer.toLowerCase())
      ? `\n\nNote: Outline changes requested: "${outlineAnswer}". Please incorporate.`
      : "";
    const resolvedTopic = resolveTopicChoice(topicChoice, stepDataRef.current[3]?.text);
    stepInputsRef.current[6] = { topic: resolvedTopic, outNote };
    patchStep(6, { status: "loading" });
    try {
      const ragRes    = await fetchSERP(resolvedTopic);
      const ragContext = ragRes ? JSON.stringify(ragRes.organic?.slice(0, 4) ?? []) : "";
      stepInputsRef.current[6].ragContext = ragContext;

      const d6 = await callSEO(PROMPT_STEP6(resolvedTopic, outNote, ragContext), 6000);
      patchStep(6, { status: "done", text: d6.text, canRetry: false });

      try {
        const quality = QualityAssurance.validateStep(6, d6.text);
        patchStep(6, { quality });
        if (quality.qualityScore < 70)
          console.warn(`[Quality] Score ${quality.qualityScore}% — below 70% threshold`);
      } catch (err) {
        console.log("[Quality] Check skipped:", err.message);
      }
    } catch (e) {
      patchStep(6, { status: "error", error: e.message, canRetry: true });
    }
  }, [callSEO, patchStep]);

  // ── Step 5 ───────────────────────────────────────────────────
  const runStep5 = useCallback(async (topicChoice, keywordAnswer) => {
    patchStep(4, { gate: null, status: "done" });
    const kwNote = !["proceed", "yes"].includes(keywordAnswer.toLowerCase())
      ? `\n\nNote: Keyword modifications requested: "${keywordAnswer}". Please adjust accordingly.`
      : "";
    stepInputsRef.current[5] = { topic: topicChoice, kwNote };
    patchStep(5, { status: "loading" });
    try {
      const d5 = await callSEO(PROMPT_STEP5(topicChoice, kwNote));
      patchStep(5, {
        status: "waiting", text: d5.text, canRetry: false,
        gate: {
          type       : "text",
          prompt     : "Approve this outline to generate the full blog post?",
          hint       : "Type 'approve' to continue, or describe any changes.",
          placeholder: "approve, or describe changes…",
          onSubmit   : (ans) => runStep6(topicChoice, ans),
        },
      });
    } catch (e) {
      patchStep(5, { status: "error", error: e.message, canRetry: true });
    }
  }, [callSEO, patchStep, runStep6]);

  // ── Step 4 ───────────────────────────────────────────────────
  const runStep4 = useCallback(async (topicChoice) => {
    const resolvedTopic = resolveTopicChoice(topicChoice, stepDataRef.current[3]?.text);
    stepInputsRef.current[4] = { topic: resolvedTopic, originalChoice: topicChoice };
    patchStep(3, { gate: null, status: "done" });
    patchStep(4, { status: "loading" });
    try {
      const serpRes    = await fetchSERP(resolvedTopic);
      const serpDataStr = serpRes ? JSON.stringify(serpRes.organic ?? []) : "";
      stepInputsRef.current[4].serpDataStr = serpDataStr;

      const d4      = await callSEO(PROMPT_STEP4(resolvedTopic, serpDataStr), 4096, true);
      const keywords = extractKeywords(d4.text);
      if (keywords.length) checkRankings(siteUrlRef.current, keywords);

      patchStep(4, {
        status: "waiting", text: d4.text, serpData: serpRes, canRetry: false,
        gate: {
          type       : "text",
          prompt     : "Proceed with these keywords, or modify them?",
          hint       : "Type 'proceed' to continue, or describe modifications.",
          placeholder: "proceed, or describe changes…",
          onSubmit   : (ans) => runStep5(topicChoice, ans),
        },
      });
    } catch (e) {
      patchStep(4, { status: "error", error: e.message, canRetry: true });
    }
  }, [callSEO, patchStep, checkRankings, runStep5]);

  // ── Step 3 ───────────────────────────────────────────────────
  const runStep3 = useCallback(async () => {
    stepInputsRef.current[3] = {};
    patchStep(3, { status: "loading" });
    try {
      const rivals    = stepDataRef.current[2]?.serpData?.organic ?? [];
      const rivalsStr = rivals.length > 0
        ? rivals.map(r => `${r.title} (${r.link})`).join("\n")
        : "(No live competitor data — generate topics based on niche context and current March 2026 trends)";

      const d3 = await callSEO(PROMPT_STEP3(rivalsStr), 4096, true);
      patchStep(3, {
        status: "waiting", text: d3.text, canRetry: false,
        gate: {
          type       : "topic-select",
          prompt     : "Which topic would you like to proceed with?",
          hint: "Click a topic card below, or type a number (1–10). Low competition topics rank fastest.",
          placeholder: "e.g. 3 or paste the topic title…",
          onSubmit   : runStep4,
        },
      });
    } catch (e) {
      patchStep(3, { status: "error", error: e.message, canRetry: true });
    }
  }, [callSEO, patchStep, runStep4]);

  // ── Step 2 ───────────────────────────────────────────────────
  const runStep2 = useCallback(async () => {
    stepInputsRef.current[2] = {};
    patchStep(2, { status: "loading" });
    try {
      const curYear  = new Date().getFullYear();
      const curMonth = new Date().toLocaleString("en-US", { month: "long" });
      const serpRes  = await fetchSERP(
        `top competitor blog posts ${curMonth} ${curYear} trending for ${siteUrlRef.current}`,
        { time: "m" } // Past Month only for hyper-recency
      );
      const serpDataStr = serpRes?.organic?.length > 0 ? JSON.stringify(serpRes.organic) : "";
      const d2          = await callSEO(PROMPT_STEP2(serpDataStr), 4096, true);
      patchStep(2, { status: "done", text: d2.text, serpData: serpRes, canRetry: false });
    } catch (e) {
      patchStep(2, { status: "error", error: e.message, canRetry: true });
    }
  }, [callSEO, patchStep]);

  // ── Step 1 ───────────────────────────────────────────────────
  const runWorkflow = useCallback(async (rawUrl, context) => {
    stepInputsRef.current[1] = { url: rawUrl, ...context };
    patchStep(1, { status: "loading" });
    try {
      const scrapeRes = await fetch("/api/scrape", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ url: rawUrl }),
      }).then(r => r.json()).catch(() => null);

      const scrapeContext = scrapeRes && !scrapeRes.error
        ? [
            `Title: ${scrapeRes.title}`,       `Desc: ${scrapeRes.description}`,
            `Canonical: ${scrapeRes.canonical}`, `Robots: ${scrapeRes.robots}`,
            `H1: ${scrapeRes.h1}`,               `H2s: ${scrapeRes.h2s}`,
            `H3s: ${scrapeRes.h3s}`,             `Core Content Sample: ${scrapeRes.mainText}`,
          ].join("\n")
        : "";
      stepInputsRef.current[1].scrapeContext = scrapeContext;

      const d1 = await callSEO(PROMPT_STEP1(rawUrl, context, scrapeContext));
      patchStep(1, { status: "done", text: d1.text, canRetry: false });
    } catch (e) {
      patchStep(1, { status: "error", error: e.message, canRetry: true });
    }
  }, [callSEO, patchStep]);

  // ── Reactive Chain ───────────────────────────────────────────
  const runStep2Ref = useRef(runStep2);
  const runStep3Ref = useRef(runStep3);
  const runStep7Ref = useRef(runStep7);
  useEffect(() => { runStep2Ref.current = runStep2; }, [runStep2]);
  useEffect(() => { runStep3Ref.current = runStep3; }, [runStep3]);
  useEffect(() => { runStep7Ref.current = runStep7; }, [runStep7]);

  useEffect(() => {
    if (phase !== "running") return;
    if (stepData[1]?.status === "done" && !stepData[2]) runStep2Ref.current();
    if (stepData[2]?.status === "done" && !stepData[3]) runStep3Ref.current();
    if (stepData[6]?.status === "done" && !stepData[7]) runStep7Ref.current();
  }, [phase, stepData]);

  // ── Retry ────────────────────────────────────────────────────
  const retryStep = useCallback(async (stepId) => {
    const inp = stepInputsRef.current[stepId];
    if (!inp) return;
    patchStep(stepId, { status: "loading", error: null });

    const handlers = {
      1: () => callSEO(PROMPT_STEP1(inp.url, inp, inp.scrapeContext), 4096, true),
      2: () => callSEO(PROMPT_STEP2(),                                                 4096, true),
      3: () => callSEO(PROMPT_STEP3(),                                                 4096, true),
      4: () => callSEO(PROMPT_STEP4(inp.topic, inp.serpDataStr),                      4096, true),
      5: () => callSEO(PROMPT_STEP5(inp.topic, inp.kwNote ?? ""),                     4096, true),
      6: () => callSEO(PROMPT_STEP6(inp.topic, inp.outNote, inp.ragContext),           6000, true),
      7: () => callSEO(PROMPT_STEP7(),                                                 4096, true),
    };

    try {
      const result = await handlers[stepId]?.();
      if (result) patchStep(stepId, { status: "done", text: result.text, canRetry: false });
    } catch (e) {
      patchStep(stepId, { status: "error", error: e.message, canRetry: true });
    }
  }, [callSEO, patchStep]);

  // ── Gate Handler ─────────────────────────────────────────────
  const handleGateSubmit = useCallback((stepId, value) => {
    const topic = stepInputsRef.current[4]?.topic ?? "";
    switch (stepId) {
      case 3: runStep4(topic || value);        break;
      case 4: runStep5(topic, value); break;
      case 5: runStep6(topic, value); break;
      default: console.warn("[Gate] No handler for step", stepId);
    }
  }, [runStep4, runStep5, runStep6]);

  // ── Session Restore ──────────────────────────────────────────
  function restoreSession() {
    const session = loadSession();
    if (!session) return;

    setUrl(session.url ?? "");
    setSiteUrl(session.siteUrl ?? "");
    siteUrlRef.current = session.siteUrl ?? "";
    setPhase(session.phase ?? "idle");
    dispatchStep({ type: "RESET" });
    Object.entries(session.stepData ?? {}).forEach(([id, data]) =>
      dispatchStep({ type: "PATCH", id: Number(id), patch: data })
    );
    setProvider(session.provider ?? "gemini");
    if (session.brandContext) setBrandContextState(session.brandContext);
    conversationRef.current = session.conversation ?? [];
    setHasSession(false);

    if (session.phase === "running") {
      const lastDone = Math.max(
        0,
        ...Object.entries(session.stepData ?? {})
          .filter(([, d]) => d.status === "done")
          .map(([id]) => parseInt(id))
      );
      setTimeout(() => resumeWorkflow(session.siteUrl, lastDone), 800);
    }
  }

  async function resumeWorkflow(targetUrl, lastDone) {
    siteUrlRef.current = targetUrl;
    if (lastDone === 0) runWorkflow(targetUrl, brandContextRef.current);
    else if (lastDone === 1) runStep2();
    else if (lastDone === 2) runStep3();
    else if (lastDone === 6) runStep7();
  }

  function dismissSession() {
    clearSession();
    setHasSession(false);
  }

  // ── Start / Reset ────────────────────────────────────────────
  function start() {
    if (!url.trim()) return;
    let clean = url.trim();
    setUrlError("");
    try {
      if (!clean.startsWith("http")) clean = `https://${clean}`;
      const parsed = new URL(clean);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid protocol");
      if (clean.length > 2048)                             throw new Error("URL too long");
      clean = parsed.href;
    } catch {
      setUrlError("Invalid URL format. Please enter a valid website URL.");
      return;
    }
    conversationRef.current = [];
    stepInputsRef.current   = {};
    dispatchStep({ type: "RESET" });
    setSiteUrl(clean);
    siteUrlRef.current = clean;
    setPhase("running");
    runWorkflow(clean, brandContext);
  }

  function reset() {
    setPhase("idle");
    setUrl(""); setUrlError(""); setSiteUrl("");
    dispatchStep({ type: "RESET" });
    setBrandContextState({ category: "", products: "", audience: "" });
    conversationRef.current = [];
    stepInputsRef.current   = {};
    setInternalData({ radar: null, velocity: 0, rankings: [] });
    clearSession();
    setHasSession(false);
  }

  // ── Derived Values ───────────────────────────────────────────
  const renderedSteps = useMemo(
    () => STEPS.filter(s => stepData[s.id]),
    [stepData]
  );

  const allDone = useMemo(
    () => STEPS.every(s => stepData[s.id]?.status === "done"),
    [stepData]
  );

  const progressPct = useMemo(() => {
    const done = STEPS.filter(s => stepData[s.id]?.status === "done").length;
    return Math.round((done / STEPS.length) * 100);
  }, [stepData]);

  const activeStepId = useMemo(() => {
    const active = STEPS.find(
      s => stepData[s.id]?.status === "loading" || stepData[s.id]?.status === "waiting"
    );
    if (active) return active.id;
    const doneIds = STEPS.filter(s => stepData[s.id]?.status === "done").map(s => s.id);
    if (!doneIds.length) return 1;
    const lastDone = Math.max(...doneIds);
    return STEPS.find(s => s.id === lastDone + 1)?.id ?? lastDone;
  }, [stepData]);

  // ── Public API ───────────────────────────────────────────────
  return {
    url, setUrl, urlError,
    provider, setProvider,
    phase, siteUrl,
    stepData, renderedSteps, allDone,
    start, reset, retryStep, handleGateSubmit,
    bottomRef,
    steps: STEPS,
    hasSession, restoreSession, dismissSession,
    progressPct, activeStepId,
    brandContext,
    businessCategory : brandContext.category,
    keyProducts      : brandContext.products,
    targetAudience   : brandContext.audience,
    setBusinessCategory: (v) => setBrandContext("category", v),
    setKeyProducts     : (v) => setBrandContext("products", v),
    setTargetAudience  : (v) => setBrandContext("audience", v),
    internalData,
    isGeneratingVariations,
    generateVariations,
  };
}
