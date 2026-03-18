"use client";
import { Zap, Globe } from "lucide-react";

export default function Header({ phase, siteUrl, onReset }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="brand-icon">
            <Zap size={18} strokeWidth={2.5} />
          </div>
          <span className="brand-name">SEO<span className="brand-accent">Agent</span></span>
        </div>

        {phase !== "idle" && siteUrl && (
          <div className="header-site-pill">
            <Globe size={13} />
            <span>{siteUrl.replace(/^https?:\/\//, "")}</span>
          </div>
        )}

        <div className="header-actions">
          <div className="header-badge">
            <span className="badge-dot" />
            Web Search On
          </div>
          {phase !== "idle" && (
            <button className="btn-outline-sm" onClick={onReset}>
              New Analysis
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
