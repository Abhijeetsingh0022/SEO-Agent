"use client";
import { useState } from "react";
import {
  ChevronDown, ChevronUp, CheckCircle2, Loader2, AlertCircle,
  Clock, Copy, CheckCheck, Download, RotateCcw,
} from "lucide-react";
import { ICON_MAP } from "@/lib/iconMap";
import MarkdownContent from "./MarkdownContent";
import LoadingIndicator from "./LoadingIndicator";
import GateInput from "./GateInput";
import SerpInsights from "./SerpInsights";

export default function StepCard({ step, data, onRetry }) {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const StepIcon = ICON_MAP[step.icon] || ICON_MAP.search;

  const statusConfig = {
    loading: { label: "In Progress",    cls: "s-loading", Icon: Loader2 },
    done:    { label: "Complete",       cls: "s-done",    Icon: CheckCircle2 },
    waiting: { label: "Awaiting Input", cls: "s-waiting", Icon: Clock },
    error:   { label: "Error",          cls: "s-error",   Icon: AlertCircle },
  };

  const sc = statusConfig[data.status] || {};
  const StatusIcon = sc.Icon;

  async function handleCopy() {
    if (!data.text) return;
    try {
      await navigator.clipboard.writeText(data.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Could not copy to clipboard.");
    }
  }

  function handleDownload() {
    if (!data.text) return;
    const blob = new Blob([data.text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `step-${step.id}-${step.label.toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
  }

  // ── Skeleton loading state ───────────────────────────────────
  if (data.status === "loading") {
    return (
      <div className={`step-card sc-loading`}>
        <div className="sc-header">
          <div className="sc-icon-wrap">
            <StepIcon size={15} strokeWidth={2} />
          </div>
          <div className="sc-title-group">
            <span className="sc-num">Step {step.id}</span>
            <span className="sc-title">{step.label}</span>
          </div>
          <span className="status-badge" style={{ background: "rgba(225, 29, 72, 0.05)", color: "#E11D48", borderColor: "rgba(225, 29, 72, 0.15)" }}>
            <Loader2 size={10} strokeWidth={3} className="spin" />
            RUNNING
          </span>
        </div>
        <div className="sc-body">
          <div className="skeleton-block">
            <div className="skeleton-line w-3/4" />
            <div className="skeleton-line w-full" />
            <div className="skeleton-line w-5/6" />
            <div className="skeleton-line w-2/3" />
            <div className="skeleton-line w-full" />
            <div className="skeleton-line w-4/5" />
          </div>
          <LoadingIndicator label={`Researching Step ${step.id} — ${step.label}…`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`step-card sc-${data.status}`}>
      {/* Header */}
      <div className="sc-header">
        <div className="sc-icon-wrap">
          <StepIcon size={15} strokeWidth={2} />
        </div>
        <div className="sc-title-group">
          <span className="sc-num">Step {step.id}</span>
          <span className="sc-title">{step.label}</span>
        </div>

        {/* Status Badge */}
        {data.status === "done" ? (
          <span className="status-badge" style={{ background: "rgba(16, 185, 129, 0.05)", color: "#10B981", borderColor: "rgba(16, 185, 129, 0.15)" }}>
            <CheckCircle2 size={10} strokeWidth={3} />
            COMPLETE
          </span>
        ) : sc.label && (
          <span className={`sc-badge ${sc.cls}`}>
            {StatusIcon && (
              <StatusIcon size={11} strokeWidth={2.5} className={data.status === "loading" ? "spin" : ""} />
            )}
            {sc.label}
          </span>
        )}

        {/* Quality Score Badge (Step 6 only) */}
        {data.quality && (
          <span
            className="quality-badge"
            title={`Quality Score: ${data.quality.qualityScore}%`}
            style={{
              background: data.quality.qualityScore >= 80
                ? "rgba(16, 185, 129, 0.08)"
                : data.quality.qualityScore >= 60
                ? "rgba(245, 158, 11, 0.08)"
                : "rgba(239, 68, 68, 0.08)",
              color: data.quality.qualityScore >= 80 ? "#10B981"
                : data.quality.qualityScore >= 60 ? "#F59E0B" : "#EF4444",
              borderColor: data.quality.qualityScore >= 80
                ? "rgba(16, 185, 129, 0.2)"
                : data.quality.qualityScore >= 60
                ? "rgba(245, 158, 11, 0.2)"
                : "rgba(239, 68, 68, 0.2)",
            }}
          >
            {data.quality.qualityScore >= 80 ? "✦" : "◆"} {data.quality.qualityScore}% Quality
          </span>
        )}

        {/* Action Buttons */}
        <div className="sc-actions">
          {data.status === "done" && data.text && (
            <>
              <button className="sc-action-btn" onClick={handleCopy} title="Copy step">
                {copied ? <CheckCheck size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={2} />}
              </button>
              <button className="sc-action-btn" onClick={handleDownload} title="Download step">
                <Download size={12} strokeWidth={2} />
              </button>
            </>
          )}
          {data.canRetry && (
            <button className="sc-action-btn sc-retry-btn" onClick={() => onRetry?.(step.id)} title="Retry step">
              <RotateCcw size={12} strokeWidth={2} />
            </button>
          )}
          <button
            className="sc-toggle"
            aria-label={collapsed ? "Expand step" : "Collapse step"}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="sc-body">
          {data.text && <MarkdownContent text={data.text} />}
          {data.serpData && <SerpInsights data={data.serpData} />}
          {data.error && (
            <div className="sc-error-box">
              <AlertCircle size={14} />
              {data.error}
            </div>
          )}
          {data.gate && data.status === "waiting" && (
            <GateInput {...data.gate} />
          )}
        </div>
      )}
    </div>
  );
}
