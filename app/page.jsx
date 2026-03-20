"use client";

import { AlertCircle, CheckCircle2, History, X } from "lucide-react";
import { useSEOWorkflow } from "@/hooks/useSEOWorkflow";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StepTracker from "@/components/StepTracker";
import StepCard from "@/components/StepCard";
import ExportActions from "@/components/ExportActions";
// import Footer from "@/components/Footer";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardNavigation from "@/components/DashboardNavigation";

export default function Page() {
  const {
    url, setUrl,
    urlError,
    provider, setProvider,
    phase, siteUrl,
    stepData, renderedSteps, allDone,
    start, reset, retryStep, handleGateSubmit,
    bottomRef,
    steps,
    hasSession, restoreSession, dismissSession,
    activeStepId,
    businessCategory, setBusinessCategory,
    keyProducts, setKeyProducts,
    targetAudience, setTargetAudience,
    progressPct,
    internalData,
    generateVariations,
    isGeneratingVariations,
  } = useSEOWorkflow();

  return (
    <div className="app">
      <Header 
        phase={phase} 
        siteUrl={siteUrl} 
        onReset={reset} 
        provider={provider} 
        onProviderChange={setProvider}
        progressPct={progressPct} 
      />

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
                businessCategory={businessCategory}
                setBusinessCategory={setBusinessCategory}
                keyProducts={keyProducts}
                setKeyProducts={setKeyProducts}
                targetAudience={targetAudience}
                setTargetAudience={setTargetAudience}
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
            <div className="dashboard-grid-3">
              {/* Left Column: Navigation */}
              <aside className="dashboard-nav">
                <DashboardNavigation 
                  steps={steps} 
                  stepData={stepData}
                  siteUrl={siteUrl}
                  currentStepId={activeStepId}
                />
              </aside>

              {/* Center Column: Main Content */}
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
                  onGateSubmit={handleGateSubmit}
                />
              ))}

              {/* Export */}
              {phase === "done" && allDone && (
                <ExportActions stepData={stepData} siteUrl={siteUrl} onReset={reset} />
              )}

                <div ref={bottomRef} />
              </div>
              
              {/* Sidebar Metrics Dashboard */}
              <aside className="dashboard-sidebar">
                <DashboardSidebar 
                  stepData={stepData} 
                  progressPct={progressPct} 
                  internalData={internalData}
                  onGenerateVariations={generateVariations}
                  isGeneratingVariations={isGeneratingVariations}
                />
</aside>
            </div>
          )}

        </div>
      </main>

      {/* <Footer /> */}
    </div>
  );
}
