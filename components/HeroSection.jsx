"use client";
import { ArrowRight } from "lucide-react";

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
    badge: "claude-opus-4-5",
    color: "#D97706",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.827 3.52l5.96 16.038h-3.427l-1.23-3.488H9.43l-1.23 3.488H4.773L10.733 3.52h3.094zm-1.547 4.982l-1.822 5.17h3.644l-1.822-5.17z"/>
      </svg>
    ),
  },
  {
    id: "openai",
    name: "GPT-4o",
    sub: "OpenAI",
    badge: "gpt-4o-search",
    color: "#10A37F",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.283 9.392a5.998 5.998 0 0 0-.517-4.926 6.069 6.069 0 0 0-6.52-2.91A5.997 5.997 0 0 0 10.72 0 6.07 6.07 0 0 0 4.93 4.08 5.998 5.998 0 0 0 .918 7.155 6.07 6.07 0 0 0 1.67 13.56a6 6 0 0 0 .517 4.926 6.07 6.07 0 0 0 6.52 2.91A5.998 5.998 0 0 0 13.28 24a6.07 6.07 0 0 0 5.791-4.08 5.998 5.998 0 0 0 4.012-3.074 6.07 6.07 0 0 0-.8-7.454zm-9.003 12.39a4.497 4.497 0 0 1-2.887-1.043l.143-.08 4.788-2.765a.795.795 0 0 0 .401-.69v-6.75l2.023 1.168a.073.073 0 0 1 .04.057v5.59a4.5 4.5 0 0 1-4.508 4.513zM3.38 18.45a4.498 4.498 0 0 1-.538-3.022l.143.086 4.788 2.765c.25.145.56.145.81 0l5.845-3.375v2.337a.073.073 0 0 1-.029.063L9.51 20.117a4.497 4.497 0 0 1-6.13-1.666zM2.26 7.993A4.498 4.498 0 0 1 4.598 5.89v5.66a.787.787 0 0 0 .398.687l5.845 3.375-2.023 1.168a.073.073 0 0 1-.07.006L3.974 14.1a4.5 4.5 0 0 1-1.714-6.107zm16.641 3.869-5.845-3.375 2.023-1.167a.073.073 0 0 1 .07-.006l4.774 2.787a4.5 4.5 0 0 1-.698 8.12v-5.662a.794.794 0 0 0-.324-.697zm2.01-3.03-.143-.087-4.788-2.764a.801.801 0 0 0-.81 0L9.325 9.356V7.019a.073.073 0 0 1 .029-.063l4.774-2.787a4.5 4.5 0 0 1 6.784 4.692zm-12.67 4.174-2.023-1.168a.073.073 0 0 1-.04-.057V6.19a4.5 4.5 0 0 1 7.386-3.453l-.143.08-4.788 2.765a.795.795 0 0 0-.401.69v6.75zm1.098-2.368 2.602-1.503 2.602 1.5v3l-2.602 1.5-2.602-1.5v-3z"/>
      </svg>
    ),
  },
  {
    id: "gemini",
    name: "Gemini",
    sub: "Google",
    badge: "gemini-3-flash-preview",
    color: "#4285F4",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
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
      <div className="hero-tag">
        <span className="tag-dot" />
        AI-Powered • 7-Step Workflow • Web Search Enabled
      </div>

      <h1 className="hero-title">
        Generate SEO-Optimized<br />
        <span className="title-accent">Blog Content</span> in Minutes
      </h1>

      <p className="hero-sub">
        Enter your website URL. Our AI agent analyzes your brand, researches competitors,
        generates topics, performs keyword research, and writes a complete 1800–2500 word
        blog post — with live web search at every step.
      </p>

      {/* Provider selector */}
      <div className="provider-section">
        <span className="provider-label">AI Model</span>
        <div className="provider-pills">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              className={`provider-pill ${provider === p.id ? "active" : ""}`}
              onClick={() => setProvider(p.id)}
              style={provider === p.id ? { borderColor: p.color, color: p.color, background: `${p.color}10` } : {}}
            >
              <span className="provider-pill-icon" style={provider === p.id ? { color: p.color } : {}}>
                {p.icon}
              </span>
              <span className="provider-pill-text">
                <span className="provider-pill-name">{p.name}</span>
                <span className="provider-pill-sub">{p.sub}</span>
              </span>
              {provider === p.id && (
                <span className="provider-pill-badge" style={{ background: p.color }}>
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
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Feature pills */}
      <div className="feature-pills">
        {FEATURES.map((f) => (
          <div className="feature-pill" key={f}>
            <span className="pill-check">✓</span>
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ color: "#94A3B8", position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
    >
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" x2="22" y1="12" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}
