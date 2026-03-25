"use client";

import { CheckCircle2, Circle, Loader2, AlertCircle, Clock, ChevronRight } from "lucide-react";

// Count words in a text block
function countWords(text) {
  if (!text || typeof text !== "string") return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Status config: icon, color class, label
function getStatusConfig(status, isActive) {
  if (status === "done")    return { icon: "done",    color: "nav-dot-done",    label: "Done" };
  if (status === "loading") return { icon: "loading",  color: "nav-dot-loading", label: "Running..." };
  if (status === "waiting") return { icon: "waiting",  color: "nav-dot-waiting", label: "Needs Input" };
  if (status === "error")   return { icon: "error",    color: "nav-dot-error",   label: "Error" };
  if (isActive)             return { icon: "pending",  color: "nav-dot-active",  label: "Up Next" };
  return                           { icon: "idle",     color: "nav-dot-idle",    label: "" };
}

export default function DashboardNavigation({ steps, stepData, currentStepId, siteUrl }) {
  const completedCount = steps.filter(s => stepData[s.id]?.status === "done").length;
  const totalWords = Object.values(stepData).reduce((sum, d) => sum + countWords(d?.text), 0);

  return (
    <div className="dash-nav-inner">
      {/* Session Header */}
      <div className="nav-header">
        <div className="nav-site-info">
          <p className="nav-site-label">Active Audit</p>
          <p className="nav-site-name" title={siteUrl}>
            {siteUrl ? siteUrl.replace(/^https?:\/\//, "").split("/")[0] : "Idle"}
          </p>
        </div>
        {/* Real-time session stats */}
        <div className="nav-session-stats">
          <span className="nav-stat">
            <span className="nav-stat-val">{completedCount}</span>
            <span className="nav-stat-label">/{steps.length} done</span>
          </span>
          <span className="nav-stat-divider">·</span>
          <span className="nav-stat">
            <span className="nav-stat-val">
              {totalWords > 999 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords || "0"}
            </span>
            <span className="nav-stat-label"> words</span>
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="nav-progress-bar-wrap">
        <div
          className="nav-progress-bar-fill"
          style={{ width: `${Math.round((completedCount / steps.length) * 100)}%` }}
        />
      </div>

      {/* Workflow Steps */}
      <nav className="nav-section">
        <p className="nav-section-title">Workflow Progress</p>
        <div className="nav-items">
          {steps.map((s) => {
            const status = stepData[s.id]?.status || "idle";
            const isActive = s.id === currentStepId;
            const { icon, color } = getStatusConfig(status, isActive);
            const stepWords = countWords(stepData[s.id]?.text);
            const hasError = status === "error";

            const handleClick = () => {
              const el = document.getElementById(`step-card-${s.id}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            };

            return (
              <div
                key={s.id}
                className={`nav-item ${isActive ? "active" : ""} ${status === "done" ? "done" : ""} ${status === "waiting" ? "waiting" : ""} ${hasError ? "error" : ""}`}
                onClick={handleClick}
                style={{ cursor: "pointer" }}
              >
                {/* Status icon */}
                <div className="nav-item-icon-wrap">
                  {icon === "done" && (
                    <CheckCircle2 size={15} className="nav-icon-done" strokeWidth={2.5} />
                  )}
                  {icon === "loading" && (
                    <Loader2 size={15} className="nav-icon-loading" strokeWidth={2.5} />
                  )}
                  {icon === "waiting" && (
                    <div className="nav-dot-pulse" />
                  )}
                  {icon === "error" && (
                    <AlertCircle size={15} className="nav-icon-error" strokeWidth={2.5} />
                  )}
                  {(icon === "idle" || icon === "pending") && (
                    <Circle size={15} className={icon === "pending" ? "nav-icon-pending" : "nav-icon-idle"} strokeWidth={2} />
                  )}
                </div>

                {/* Label + word count hint */}
                <div className="nav-item-content">
                  <span className="nav-item-label">{s.short}</span>
                  {status === "done" && stepWords > 0 && (
                    <span className="nav-item-meta">
                      {stepWords > 999 ? `${(stepWords / 1000).toFixed(1)}k` : stepWords} words
                    </span>
                  )}
                  {status === "loading" && (
                    <span className="nav-item-meta running">Generating...</span>
                  )}
                  {status === "waiting" && (
                    <span className="nav-item-meta waiting">Action needed</span>
                  )}
                  {status === "error" && (
                    <span className="nav-item-meta error">Failed — retry</span>
                  )}
                </div>

                {/* Right indicator */}
                {status === "done" && <CheckTiny />}
                {status === "waiting" && <ActionTiny />}
                {isActive && status !== "done" && <div className="nav-item-indicator" />}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function ActionTiny() {
  return (
    <div
      className="nav-action-dot"
      style={{
        width: 8, height: 8, borderRadius: "50%",
        background: "#f59e0b", marginLeft: "auto", flexShrink: 0,
        animation: "pulse 1.5s ease-in-out infinite",
        boxShadow: "0 0 8px rgba(245,158,11,0.5)"
      }}
    />
  );
}

function CheckTiny() {
  return (
    <svg
      width="11" height="11" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="3.5"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ marginLeft: "auto", flexShrink: 0, color: "#10b981" }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
