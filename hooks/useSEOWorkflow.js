"use client";

import { useState, useRef, useEffect } from "react";
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

async function callAnthropicAPI(messages, systemPrompt, maxTokens, provider = "anthropic") {
  const res = await fetch("/api/seo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, systemPrompt, maxTokens, provider }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

export function useSEOWorkflow() {
  const [provider, setProvider] = useState("anthropic"); // "anthropic" | "openai"
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | running | done
  const [siteUrl, setSiteUrl] = useState("");
  const [stepData, setStepData] = useState({});
  const conversationRef = useRef([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [stepData]);

  function patchStep(id, patch) {
    setStepData((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  }

  async function callSEO(userMessage, maxTokens = 4096) {
    conversationRef.current.push({ role: "user", content: userMessage });
    const text = await callAnthropicAPI(conversationRef.current, SYSTEM_PROMPT, maxTokens, provider);
    conversationRef.current.push({ role: "assistant", content: text });
    return text;
  }

  // ── Step 1 → 2 → 3 ──────────────────────────────────────────
  async function runWorkflow(targetUrl) {
    // Step 1
    patchStep(1, { status: "loading" });
    try {
      const t1 = await callSEO(PROMPT_STEP1(targetUrl));
      patchStep(1, { status: "done", text: t1 });
    } catch (e) {
      patchStep(1, { status: "error", error: e.message });
      return;
    }

    // Step 2
    patchStep(2, { status: "loading" });
    try {
      const t2 = await callSEO(PROMPT_STEP2());
      patchStep(2, { status: "done", text: t2 });
    } catch (e) {
      patchStep(2, { status: "error", error: e.message });
      return;
    }

    // Step 3
    patchStep(3, { status: "loading" });
    try {
      const t3 = await callSEO(PROMPT_STEP3());
      patchStep(3, {
        status: "waiting",
        text: t3,
        gate: {
          prompt: "Which topic would you like to proceed with?",
          hint: "Enter a number (1–10) or paste the topic title. Topics with 'Low' competition rank fastest.",
          placeholder: "e.g. 3 or paste the topic title…",
          onSubmit: runStep4,
        },
      });
    } catch (e) {
      patchStep(3, { status: "error", error: e.message });
    }
  }

  // ── Step 4 ───────────────────────────────────────────────────
  async function runStep4(topicChoice) {
    patchStep(3, { gate: null, status: "done" });
    patchStep(4, { status: "loading" });
    try {
      const t4 = await callSEO(PROMPT_STEP4(topicChoice));
      patchStep(4, {
        status: "waiting",
        text: t4,
        gate: {
          prompt: "Proceed with these keywords, or modify them?",
          hint: "Type 'proceed' to continue, or describe modifications.",
          placeholder: "proceed, or describe changes…",
          onSubmit: (ans) => runStep5(topicChoice, ans),
        },
      });
    } catch (e) {
      patchStep(4, { status: "error", error: e.message });
    }
  }

  // ── Step 5 ───────────────────────────────────────────────────
  async function runStep5(topicChoice, keywordAnswer) {
    patchStep(4, { gate: null, status: "done" });
    const kwNote =
      keywordAnswer.toLowerCase() !== "proceed" && keywordAnswer.toLowerCase() !== "yes"
        ? `\n\nNote: The user requested keyword modifications: "${keywordAnswer}". Please adjust accordingly.`
        : "";
    patchStep(5, { status: "loading" });
    try {
      const t5 = await callSEO(PROMPT_STEP5(topicChoice, kwNote));
      patchStep(5, {
        status: "waiting",
        text: t5,
        gate: {
          prompt: "Approve this outline to generate the full blog post?",
          hint: "Type 'approve' to continue, or describe any changes.",
          placeholder: "approve, or describe changes…",
          onSubmit: (ans) => runStep6(topicChoice, ans),
        },
      });
    } catch (e) {
      patchStep(5, { status: "error", error: e.message });
    }
  }

  // ── Step 6 + 7 ───────────────────────────────────────────────
  async function runStep6(topicChoice, outlineAnswer) {
    patchStep(5, { gate: null, status: "done" });
    const outNote =
      outlineAnswer.toLowerCase() !== "approve" && outlineAnswer.toLowerCase() !== "yes"
        ? `\n\nNote: Outline changes requested: "${outlineAnswer}". Please incorporate.`
        : "";
    patchStep(6, { status: "loading" });
    try {
      const t6 = await callSEO(PROMPT_STEP6(topicChoice, outNote), 6000);
      patchStep(6, { status: "done", text: t6 });
    } catch (e) {
      patchStep(6, { status: "error", error: e.message });
      return;
    }

    patchStep(7, { status: "loading" });
    try {
      const t7 = await callSEO(PROMPT_STEP7());
      patchStep(7, { status: "done", text: t7 });
      setPhase("done");
    } catch (e) {
      patchStep(7, { status: "error", error: e.message });
    }
  }

  // ── Public handlers ──────────────────────────────────────────
  function start() {
    if (!url.trim()) return;
    let clean = url.trim();
    if (!clean.startsWith("http")) clean = "https://" + clean;
    conversationRef.current = [];
    setStepData({});
    setSiteUrl(clean);
    setPhase("running");
    runWorkflow(clean);
  }

  function reset() {
    setPhase("idle");
    setUrl("");
    setSiteUrl("");
    setStepData({});
    conversationRef.current = [];
  }

  const renderedSteps = STEPS.filter((s) => stepData[s.id]);
  const allDone = STEPS.every((s) => stepData[s.id]?.status === "done");

  return {
    url, setUrl,
    provider, setProvider,
    phase, siteUrl,
    stepData, renderedSteps, allDone,
    start, reset,
    bottomRef,
    steps: STEPS,
  };
}
