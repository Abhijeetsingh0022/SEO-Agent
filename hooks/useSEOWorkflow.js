"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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

async function callAPI(messages, systemPrompt, maxTokens, provider) {
  const res = await fetch("/api/seo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: buildSummarizedHistory(messages),
      systemPrompt,
      maxTokens,
      provider,
    }),
  });

  if (!res.ok) {
    let errText;
    try { errText = await res.text(); } catch { errText = `HTTP ${res.status}`; }
    throw new Error(`API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
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
  const [provider, setProvider] = useState("anthropic");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [phase, setPhase] = useState("idle");
  const [siteUrl, setSiteUrl] = useState("");
  const [stepData, setStepData] = useState({});
  const [hasSession, setHasSession] = useState(false);
  const conversationRef = useRef([]);
  const bottomRef = useRef(null);
  const stepInputsRef = useRef({});

  // ── Auto-scroll ─────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [stepData]);

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
      });
    }
  }, [stepData, phase, url, siteUrl, provider]);

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
  }

  function dismissSession() {
    clearSession();
    setHasSession(false);
  }

  async function callSEO(userMessage, maxTokens = 4096) {
    conversationRef.current.push({ role: "user", content: userMessage });
    const data = await callAPI(conversationRef.current, SYSTEM_PROMPT, maxTokens, provider);
    conversationRef.current.push({ role: "assistant", content: data.text });
    return data;
  }

  // ── Retry mechanism ──────────────────────────────────────────
  async function retryStep(stepId) {
    const inputs = stepInputsRef.current[stepId];
    if (!inputs) return;
    patchStep(stepId, { status: "loading", error: null });
    try {
      let result;
      switch (stepId) {
        case 1: result = await callSEO(PROMPT_STEP1(inputs.url)); break;
        case 2: result = await callSEO(PROMPT_STEP2()); break;
        case 3: result = await callSEO(PROMPT_STEP3()); break;
        case 4: result = await callSEO(PROMPT_STEP4(inputs.topic)); break;
        case 5: result = await callSEO(PROMPT_STEP5(inputs.topic, inputs.kwNote)); break;
        case 6: result = await callSEO(PROMPT_STEP6(inputs.topic, inputs.outNote), 6000); break;
        case 7: result = await callSEO(PROMPT_STEP7()); break;
        default: return;
      }
      patchStep(stepId, { status: "done", text: result.text, canRetry: false });
    } catch (e) {
      patchStep(stepId, { status: "error", error: e.message, canRetry: true });
    }
  }

  // ── Steps 1 → 2 → 3 ─────────────────────────────────────────
  async function runWorkflow(targetUrl) {
    stepInputsRef.current[1] = { url: targetUrl };
    patchStep(1, { status: "loading" });
    try {
      const d1 = await callSEO(PROMPT_STEP1(targetUrl));
      patchStep(1, { status: "done", text: d1.text, canRetry: false });
    } catch (e) {
      patchStep(1, { status: "error", error: e.message, canRetry: true });
      return;
    }

    stepInputsRef.current[2] = {};
    patchStep(2, { status: "loading" });
    try {
      const d2 = await callSEO(PROMPT_STEP2());
      patchStep(2, { status: "done", text: d2.text, canRetry: false });
    } catch (e) {
      patchStep(2, { status: "error", error: e.message, canRetry: true });
      return;
    }

    stepInputsRef.current[3] = {};
    patchStep(3, { status: "loading" });
    try {
      const d3 = await callSEO(PROMPT_STEP3());
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
      return;
    }

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
    runWorkflow(clean);
  }

  function reset() {
    setPhase("idle");
    setUrl("");
    setUrlError("");
    setSiteUrl("");
    setStepData({});
    conversationRef.current = [];
    clearSession();
    setHasSession(false);
  }

  const renderedSteps = STEPS.filter((s) => stepData[s.id]);
  const allDone = STEPS.every((s) => stepData[s.id]?.status === "done");
  const doneCount = STEPS.filter((s) => stepData[s.id]?.status === "done").length;
  const progressPct = Math.round((doneCount / STEPS.length) * 100);

  return {
    url, setUrl,
    urlError,
    provider, setProvider,
    phase, siteUrl,
    stepData, renderedSteps, allDone,
    start, reset, retryStep,
    bottomRef,
    steps: STEPS,
    hasSession, restoreSession, dismissSession,
    progressPct,
  };
}
