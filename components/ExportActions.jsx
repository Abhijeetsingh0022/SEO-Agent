"use client";
import { useState } from "react";
import { Copy, Download, RefreshCw, CheckCheck } from "lucide-react";
import { STEPS } from "@/lib/constants";

export default function ExportActions({ stepData, siteUrl, onReset }) {
  const [copied, setCopied] = useState(false);

  function buildFullText() {
    return STEPS.map((s) => {
      const d = stepData[s.id];
      if (!d?.text) return "";
      return `\n\n═══ STEP ${s.id}: ${s.label.toUpperCase()} ═══\n\n${d.text}`;
    }).join("\n");
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildFullText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleDownload() {
    const slug = siteUrl.replace(/^https?:\/\//, "").replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const blob = new Blob([buildFullText()], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `seo-content-${slug}.md`;
    a.click();
  }

  return (
    <div className="export-row">
      <button className="export-btn primary-export" onClick={handleCopy}>
        {copied ? <CheckCheck size={15} strokeWidth={2.5} /> : <Copy size={15} strokeWidth={2} />}
        {copied ? "Copied!" : "Copy All Content"}
      </button>
      <button className="export-btn" onClick={handleDownload}>
        <Download size={15} strokeWidth={2} />
        Download Markdown
      </button>
      <button className="export-btn reset-btn" onClick={onReset}>
        <RefreshCw size={15} strokeWidth={2} />
        New Analysis
      </button>
    </div>
  );
}
