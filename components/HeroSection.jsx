"use client";
import { ArrowRight, Globe, CheckCircle } from "lucide-react";

const FEATURES = [
  "Website Analysis",
  "Competitor Research",
  "10 Topic Ideas",
  "Keyword Research",
  "Full Blog Post",
  "SEO Meta Tags",
];

const PROVIDERS = [
  {
    id: "anthropic",
    name: "Claude",
    sub: "Anthropic",
    badge: "opus-4-5",
    color: "#D97757", // Anthropic Burnt Orange/Coral
    bgColor: "rgba(217, 119, 87, 0.04)",
    borderColor: "rgba(217, 119, 87, 0.12)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.82 19.8l-5.64-14.8c-.14-.37-.7-.37-.84 0L6.7 19.8c-.06.16.06.32.22.32h2.24c.1 0 .18-.06.22-.16l1.24-3.44h5.4l1.24 3.44c.04.1.12.16.22.16h2.24c.16 0 .28-.16.22-.32zM10.1 14.8l2.22-6.14 2.22 6.14h-4.44z"/>
      </svg>
    ),
  },
  {
    id: "openai",
    name: "GPT-4o",
    sub: "OpenAI",
    badge: "search",
    color: "#10A37F", // OpenAI Green
    bgColor: "rgba(16, 163, 127, 0.04)",
    borderColor: "rgba(16, 163, 127, 0.12)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.28 9.39a6.07 6.07 0 0 0-.52-4.93 6.07 6.07 0 0 0-6.51-2.91A6.07 6.07 0 0 0 10.72 0 6.07 6.07 0 0 0 4.93 4.08a6.07 6.07 0 0 0-4.01 3.07 6.07 6.07 0 0 0 .75 6.41 6.07 6.07 0 0 0 .52 4.93 6.07 6.07 0 0 0 6.51 2.91A6.07 6.07 0 0 0 13.28 24a6.07 6.07 0 0 0 5.79-4.08 6.07 6.07 0 0 0 4.01-3.07 6.07 6.07 0 0 0-.8-7.46zm-3.9 8.2l-2.02-1.16a.1.1 0 0 1-.04-.06v-5.59a4.51 4.51 0 0 0-7.39-3.48l-2.02-1.17a6.07 6.07 0 0 1 9.45 4.65v5.59a.1.1 0 0 1 .02.06zM8.26 10.51a4.51 4.51 0 0 1 7.39-3.48l2.02-1.17a6.07 6.07 0 0 0-9.45-4.65v5.59a.1.1 0 0 0 .04.06l2 .15z"/>
      </svg>
    ),
  },
  {
    id: "gemini",
    name: "Gemini",
    sub: "Google",
    badge: "3-flash",
    color: "#1A73E8", // Google Blue
    bgColor: "rgba(26, 115, 232, 0.04)",
    borderColor: "rgba(26, 115, 232, 0.12)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zm0-4.5c-.454-3.64-3.36-6.546-7-7 3.64-.454 6.546-3.36 7-7 .454 3.64 3.36 6.546 7 7-3.64.454-6.546 3.36-7 7z"/>
      </svg>
    ),
  },
];

export default function HeroSection({ url, setUrl, onStart, provider, setProvider }) {
  function handleKey(e) {
    if (e.key === "Enter") onStart();
  }

  return (
    <div className="hero">
      <div className="hero-eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        AI-Powered · 7-Step Workflow · Live Web Search
      </div>

      <h1 className="hero-title">
        Generate SEO-Optimized<br />
        <span className="title-accent">Blog Content</span> in Minutes
      </h1>

      <p className="hero-sub">
        Enter your website URL. Our AI agent analyzes your brand, researches competitors,
        generates topics, performs keyword research, and writes a complete 1800–2500 word
        blog post with live web search at every step.
      </p>

      {/* Provider selector */}
      <div className="provider-section">
        <span className="provider-label">Select AI Model</span>
        <div className="provider-pills">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              className={`provider-pill ${provider === p.id ? "active" : ""}`}
              onClick={() => setProvider(p.id)}
              style={
                provider === p.id
                  ? { borderColor: p.borderColor, background: p.bgColor }
                  : {}
              }
            >
              <span
                className="provider-pill-icon"
                style={provider === p.id ? { color: p.color } : {}}
              >
                {p.icon}
              </span>
              <span className="provider-pill-text">
                <span className="provider-pill-name">{p.name}</span>
                <span className="provider-pill-sub">{p.sub}</span>
              </span>
              {provider === p.id && (
                <span
                  className="provider-pill-badge"
                  style={{ background: p.color }}
                >
                  {p.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="input-card">
        <div className="input-label-row">
          <label className="field-label" htmlFor="site-url">Website URL</label>
        </div>
        <div className="input-row">
          <div className="input-wrapper">
            <GlobeIcon />
            <input
              id="site-url"
              className="url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKey}
              placeholder="https://yourbrand.com"
              autoFocus
            />
          </div>
          <button className="btn-primary" onClick={onStart} disabled={!url.trim()}>
            Analyze
            <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Feature pills */}
      <div className="feature-pills">
        {FEATURES.map((f) => (
          <div className="feature-pill" key={f}>
            <span className="pill-check">
              <CheckCircle size={11} strokeWidth={2.5} />
            </span>
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}

function GlobeIcon() {
  return (
    <Globe
      size={15}
      strokeWidth={1.8}
      style={{
        color: "var(--text-muted)",
        position: "absolute",
        left: 14,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
      }}
    />
  );
}
