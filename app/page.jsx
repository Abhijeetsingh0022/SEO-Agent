"use client";

import { AlertCircle, CheckCircle2, History, X } from "lucide-react";
import { useSEOWorkflow } from "@/hooks/useSEOWorkflow";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StepTracker from "@/components/StepTracker";
import StepCard from "@/components/StepCard";
import ExportActions from "@/components/ExportActions";
import Footer from "@/components/Footer";

export default function Page() {
  const {
    url, setUrl,
    urlError,
    provider, setProvider,
    phase, siteUrl,
    stepData, renderedSteps, allDone,
    start, reset, retryStep,
    bottomRef,
    steps,
    hasSession, restoreSession, dismissSession,
    progressPct,
  } = useSEOWorkflow();

  return (
    <div className="app">
      <Header phase={phase} siteUrl={siteUrl} onReset={reset} provider={provider} progressPct={progressPct} />

      <main className="main">
        <div className="container">

          {/* ── IDLE ──────────────────────────────── */}
          {phase === "idle" && (
            <>
              {/* Session restore banner */}
              {hasSession && (
                <div className="session-restore-banner">
                  <div className="session-restore-icon">
                    <History size={16} strokeWidth={2} />
                  </div>
                  <div className="session-restore-text">
                    <p className="session-restore-title">Resume your last session?</p>
                    <p className="session-restore-sub">You have an unfinished analysis from your previous visit.</p>
                  </div>
                  <div className="session-restore-actions">
                    <button className="session-restore-btn primary" onClick={restoreSession}>Resume</button>
                    <button className="session-restore-btn ghost" onClick={dismissSession}>
                      <X size={12} /> Dismiss
                    </button>
                  </div>
                </div>
              )}

              <HeroSection
                url={url}
                setUrl={setUrl}
                onStart={start}
                provider={provider}
                setProvider={setProvider}
              />
              {urlError && (
                <div className="url-error" style={{ margin: "0 auto" }}>
                  <AlertCircle size={14} strokeWidth={2} />
                  {urlError}
                </div>
              )}
            </>
          )}

          {/* ── RUNNING / DONE ────────────────────── */}
          {(phase === "running" || phase === "done") && (
            <div className="workflow-wrap">

              {/* Step tracker */}
              <StepTracker steps={steps} stepData={stepData} progressPct={progressPct} />

              {/* Complete banner */}
              {phase === "done" && allDone && (
                <div className="complete-banner">
                  <div className="banner-icon">
                    <CheckCircle2 size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="banner-title">Your SEO Blog Post is Ready!</p>
                    <p className="banner-sub">
                      All 7 steps complete — blog post, keywords, outline, and full SEO meta output generated.
                    </p>
                  </div>
                </div>
              )}

              {/* Step cards */}
              {renderedSteps.map((s) => (
                <StepCard
                  key={s.id}
                  step={s}
                  data={stepData[s.id]}
                  onRetry={retryStep}
                />
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

      <Footer />
    </div>
  );
}
