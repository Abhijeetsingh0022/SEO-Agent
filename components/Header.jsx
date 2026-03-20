"use client";

import { useMemo } from "react";
import { Globe, Zap, RotateCcw, Wifi } from "lucide-react";
import { PrivacyNotice } from "./PrivacyNotice";

export default function Header({ phase, siteUrl, onReset, provider }) {
  const displayUrl = useMemo(() => {
    return siteUrl ? siteUrl.replace(/^https?:\/\//, "") : "";
  }, [siteUrl]);

  const isNotIdle = phase !== "idle";

  return (
    <header className="header">
      <div className="header-inner">

        {/* Left: Brand */}
        <div className="header-brand">
          <div className="brand-icon" aria-hidden="true">
            <Zap size={15} strokeWidth={2.5} />
          </div>
          <span className="brand-name">
            SEO<span className="brand-accent">Agent</span>
          </span>
          <div className="provider-indicator">
            {provider === "gemini" && (
              <span className="provider-mini-badge" style={{ borderColor: "rgba(159, 18, 57, 0.12)", color: "#9F1239" }}>Gemini</span>
            )}
            {provider === "openai" && (
              <span className="provider-mini-badge" style={{ borderColor: "rgba(190, 18, 60, 0.12)", color: "#BE123C" }}>GPT-4o</span>
            )}
            {provider === "anthropic" && (
              <span className="provider-mini-badge" style={{ borderColor: "rgba(225, 29, 72, 0.12)", color: "#E11D48" }}>Claude</span>
            )}
          </div>
        </div>

        {/* Center: Site Pill */}
        <div className="header-center">
          {isNotIdle && displayUrl && (
            <div className="header-site-pill">
              <Globe size={11} strokeWidth={2.5} />
              <span>{displayUrl}</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="header-actions">
          <div className="live-search-chip" title="Active background search enabled">
            <Wifi size={10} strokeWidth={3} />
            <span>Live Search</span>
          </div>

          <PrivacyNotice />

          {isNotIdle && (
            <button
              className="header-btn-new"
              onClick={onReset}
              aria-label="New Analysis"
            >
              <RotateCcw size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
