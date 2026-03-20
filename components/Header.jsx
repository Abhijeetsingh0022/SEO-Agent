"use client";

import { useMemo } from "react";
import { Globe, Zap, RotateCcw, Wifi } from "lucide-react";
import { PrivacyNotice } from "./PrivacyNotice";

export default function Header({ phase, siteUrl, onReset, provider, onProviderChange }) {
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
          <div className="provider-selector-wrap">
            <select 
              className="header-provider-select"
              value={provider}
              onChange={(e) => onProviderChange(e.target.value)}
            >
              <option value="gemini">Gemini 3 Flash</option>
            </select>
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
