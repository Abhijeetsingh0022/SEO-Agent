"use client";

import { CheckCircle2 } from "lucide-react";
import { useSEOWorkflow } from "@/hooks/useSEOWorkflow";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StepTracker from "@/components/StepTracker";
import StepCard from "@/components/StepCard";
import ExportActions from "@/components/ExportActions";

export default function Page() {
  const {
    url, setUrl,
    provider, setProvider,
    phase, siteUrl,
    stepData, renderedSteps, allDone,
    start, reset,
    bottomRef,
    steps,
  } = useSEOWorkflow();

  return (
    <div className="app">
      <Header phase={phase} siteUrl={siteUrl} onReset={reset} />

      <main className="main">
        <div className="container">

          {/* ── IDLE ──────────────────────────────── */}
          {phase === "idle" && (
            <HeroSection url={url} setUrl={setUrl} onStart={start} provider={provider} setProvider={setProvider} />
          )}

          {/* ── RUNNING / DONE ────────────────────── */}
          {(phase === "running" || phase === "done") && (
            <div className="workflow-wrap">

              {/* Step tracker */}
              <StepTracker steps={steps} stepData={stepData} />

              {/* Complete banner */}
              {phase === "done" && allDone && (
                <div className="complete-banner">
                  <div className="banner-icon">
                    <CheckCircle2 size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="banner-title">Your SEO Blog Post is Ready!</p>
                    <p className="banner-sub">All 7 steps complete — blog post, keywords, outline, and full SEO meta output generated.</p>
                  </div>
                </div>
              )}

              {/* Step cards */}
              {renderedSteps.map((s) => (
                <StepCard key={s.id} step={s} data={stepData[s.id]} />
              ))}

              {/* Export */}
              {phase === "done" && allDone && (
                <ExportActions stepData={stepData} siteUrl={siteUrl} onReset={reset} />
              )}

              <div ref={bottomRef} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
