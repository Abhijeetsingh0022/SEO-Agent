"use client";
import { 
  ArrowRight, 
  Globe, 
  ChevronRight, 
  CheckCircle2, 
  Crown, 
  Zap,
  Tag,
  Package,
  Users
} from "lucide-react";

const FEATURES = [
  "Live Brand Scraping",
  "Competitor Research",
  "Audit Recommendations",
  "10 Topic Ideas",
  "Keyword Research",
  "Full Blog Post",
  "SEO Meta Tags",
];

const PROVIDERS = [
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

export default function HeroSection({ 
  url, setUrl, 
  onStart, 
  provider, setProvider,
  businessCategory, setBusinessCategory,
  keyProducts, setKeyProducts,
  targetAudience, setTargetAudience
}) {
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

      {/* Input Card */}
      <div className="input-card">
        <div className="input-card-header">
          <h2 className="input-card-title">Brand & Website Analysis</h2>
          <p className="input-card-sub">AI analyzes brand tone, detects SEO gaps & unlocks opportunities</p>
        </div>

        <div className="input-grid">
          {/* Website URL */}
          <div className="input-group full">
            <label className="field-label" htmlFor="site-url">Website URL <span className="text-red">*</span></label>
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
            </div>
          </div>

          {/* Business Category */}
          <div className="input-group">
            <label className="field-label">Business Category</label>
            <div className="input-wrapper">
              <Tag size={16} className="input-icon-left" />
              <input
                className="context-input"
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                placeholder="e.g. Skincare, Jewellery, Fashion"
              />
            </div>
          </div>

          {/* Key Products */}
          <div className="input-group">
            <label className="field-label">Key Products</label>
            <div className="input-wrapper">
              <Package size={16} className="input-icon-left" />
              <input
                className="context-input"
                value={keyProducts}
                onChange={(e) => setKeyProducts(e.target.value)}
                placeholder="e.g. Face serums, Gold rings"
              />
            </div>
          </div>

          {/* Target Audience */}
          <div className="input-group full">
            <label className="field-label">Target Audience</label>
            <div className="input-wrapper">
              <Users size={16} className="input-icon-left" />
              <input
                className="context-input"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Women 25-40, Tech professionals..."
              />
            </div>
          </div>

          <div className="input-group action-group">
            <button className="btn-primary start-btn" onClick={onStart} disabled={!url.trim()}>
              Start Strategic Analysis
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Feature pills */}
      <div className="feature-pills">
        {FEATURES.map((f) => (
          <div className="feature-pill" key={f}>
            <span className="pill-check">
              <CheckCircle2 size={11} strokeWidth={2.5} />
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
