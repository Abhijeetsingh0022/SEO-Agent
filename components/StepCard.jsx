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
import KeywordGrid from "./KeywordGrid";
import CompetitorGrid from "./CompetitorGrid";

export default function StepCard({ step, data, onRetry, onGateSubmit }) {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const StepIcon = ICON_MAP[step.icon] || ICON_MAP.search;

  const statusConfig = {
    loading: { label: "In Progress",    cls: "s-loading", Icon: Loader2 },
    done:    { label: "Complete",       cls: "s-done",    Icon: CheckCircle2 },
    waiting: { label: "Awaiting Input", cls: "s-waiting", Icon: Clock },
    error:   { label: "Error",          cls: "s-error",   Icon: AlertCircle },
  };

  const sc = statusConfig[data.status] || {};
  const StatusIcon = sc.Icon;

  // Clean strings for PDF
  function cleanString(str) {
    if (!str) return "";
    return str
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{1F1E6}-\u{1F1FF}]/gu, '')
      .replace(/\*\*/g, "").replace(/__/g, "").replace(/\*/g, "").replace(/_/g, "").replace(/`/g, "")
      .replace(/[^\x00-\x7F]/g, "").trim();
  }

  async function handleCopy() {
    if (!data.text) return;
    try {
      await navigator.clipboard.writeText(data.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { alert("Could not copy to clipboard."); }
  }

  async function handleDownload() {
    if (!data.text || downloading) return;
    setDownloading(true);
    try {
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default?.jsPDF || jsPDFModule.default;
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const M = 20; const maxW = pageW - M * 2;
      const RED = [225, 29, 72]; const DARK = [15, 23, 42]; const MUTED = [148, 163, 184];
      const WHITE = [255, 255, 255]; const BG = [248, 250, 252];
      let y = 0;

      function checkBreak(needed = 12) {
        if (y + needed > pageH - 18) { doc.addPage(); doc.setFillColor(...RED); doc.rect(0, 0, pageW, 8, "F"); y = 18; }
      }

      doc.setFillColor(...RED); doc.rect(0, 0, pageW, 40, "F");
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(255, 200, 210);
      doc.text(`AUDIT PHASE ${step.id} · SEO AGENT`, M, 12);
      doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(...WHITE);
      doc.text(cleanString(step.label), M, 28);
      y = 72;

      const lines = data.text.split("\n");
      for (const rawLine of lines) {
        if (!rawLine.trim()) { y += 3.5; continue; }
        const cleanL = cleanString(rawLine);
        const wrapped = doc.splitTextToSize(cleanL, maxW);
        checkBreak(wrapped.length * 6 + 2);
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...DARK);
        wrapped.forEach(wl => { doc.text(wl, M, y); y += 6; checkBreak(8); });
        y += 2;
      }

      const total = doc.internal.getNumberOfPages();
      for (let p = 1; p <= total; p++) {
        doc.setPage(p);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...MUTED);
        doc.text(`SEO AGENT · PHASE ${step.id} · PAGE ${p} OF ${total}`, M, pageH - 8);
      }

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `step-${step.id}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (err) { alert("PDF failed: " + err.message); } finally { setDownloading(false); }
  }

  // Loading State
  if (data.status === "loading") {
    return (
      <div className="step-card sc-loading" id={`step-card-${step.id}`}>
        <div className="sc-header">
          <div className="sc-icon-wrap"><StepIcon size={15} /></div>
          <div className="sc-title-group"><span className="sc-num">Step {step.id}</span><span className="sc-title">{step.label}</span></div>
          <span className="status-badge s-loading">
            <Loader2 size={10} className="spin" /> RUNNING
          </span>
        </div>
        <div className="sc-body">
          <LoadingIndicator label={`Researching Step ${step.id}...`} />
        </div>
      </div>
    );
  }

  // Error State Rendering
  const isRateLimited = data.error?.includes("429") || data.error?.toLowerCase().includes("rate limit");

  return (
    <div className={`step-card sc-${data.status}`} id={`step-card-${step.id}`}>
      <div className="sc-header">
        <div className="sc-icon-wrap"><StepIcon size={15} strokeWidth={2} /></div>
        <div className="sc-title-group">
          <span className="sc-num">Step {step.id}</span>
          <span className="sc-title">{step.label}</span>
        </div>

        <div className="sc-header-right">
          {/* Badge */}
          {sc.label && (
            <span className={`status-badge ${sc.cls}`}>
              {StatusIcon && <StatusIcon size={10} strokeWidth={3} className={data.status === "loading" ? "spin" : ""} />}
              {sc.label}
            </span>
          )}

          <div className="sc-actions">
            {data.status === "done" && data.text && (
              <>
                <button className="sc-action-btn" onClick={handleCopy} title="Copy Content">{copied ? <CheckCheck size={12} strokeWidth={2.5}/> : <Copy size={12} strokeWidth={2}/>}</button>
                <button className="sc-action-btn" onClick={handleDownload} disabled={downloading} title="Download PDF">{downloading ? <Loader2 size={12} className="spin"/> : <Download size={12}/>}</button>
              </>
            )}
            {data.status === "error" && (
              <button className="sc-action-btn retry" onClick={() => onRetry(step.id)} title="Retry Step">
                <RotateCcw size={12} />
              </button>
            )}
            <button className="sc-toggle" onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}</button>
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="sc-body">
          {/* Error Message */}
          {data.status === "error" && (
            <div className="sc-error-box">
              <div className="sc-error-icon"><AlertCircle size={16} /></div>
              <div className="sc-error-content">
                <p className="sc-error-title">Step failed to complete</p>
                <p className="sc-error-msg">{data.error}</p>
                {isRateLimited && (
                  <p className="sc-error-tip">
                    <strong>Tip:</strong> This provider is currently at capacity. Try switching to a different AI model in the top header, or wait a few minutes.
                  </p>
                )}
                <button className="sc-error-retry" onClick={() => onRetry(step.id)}>
                  <RotateCcw size={14} /> Try Again Now
                </button>
              </div>
            </div>
          )}

          {step.id === 2 && data.text ? (
            <CompetitorGrid text={data.text} />
          ) : step.id === 4 && data.text ? (
            <KeywordGrid text={data.text} />
          ) : (
            data.text && <MarkdownContent text={data.text} />
          )}
          {data.serpData && <SerpInsights data={data.serpData} />}
          {data.gate && (
            <div className="sc-gate-wrap">
              <GateInput gate={data.gate} stepId={step.id} onSubmit={onGateSubmit} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
