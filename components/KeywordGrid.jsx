"use client";

import React, { useState } from "react";
import { 
  Target, BarChart3, Zap, TrendingUp, Search,
  ShoppingCart, Info, Navigation, ArrowRight, Activity,
  Copy, CheckCircle2
} from "lucide-react";

// Intent icons and colors
const INTENT_MAP = {
  Informational: { icon: Info, color: "var(--blue)" },
  Commercial:    { icon: BarChart3, color: "var(--amber)" },
  Transactional: { icon: ShoppingCart, color: "var(--green)" },
  Navigational:  { icon: Navigation, color: "var(--purple)" },
};

// Difficulty colors
function getDiffColor(score) {
  const n = parseInt(score);
  if (isNaN(n)) return "var(--text-muted)";
  if (n < 30) return "var(--green)";
  if (n < 60) return "var(--amber)";
  return "var(--red)";
}

export default function KeywordGrid({ text }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!text) return null;

  // Split logic based on numbering (1., 2., etc.)
  const blocks = text.split(/\n\d+\.\n?/).filter(b => b.trim().length > 10);
  const keywords = blocks.map(block => {
    const kw = block.match(/Target Keyword:\s*(.*)/i)?.[1]?.trim();
    const intent = block.match(/Search Intent:\s*(.*)/i)?.[1]?.trim();
    const pot = block.match(/Position Potential:\s*(.*)/i)?.[1]?.trim();
    const diff = block.match(/Difficulty Score:\s*(.*)/i)?.[1]?.trim();

    if (!kw) return null;
    return { kw, intent, pot, diff };
  }).filter(Boolean);

  if (keywords.length === 0) return null;

  const handleCopy = (txt, idx) => {
    navigator.clipboard.writeText(txt);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="keyword-list-wrap">
      <div className="kl-header-summary">
        <div className="kl-stat">
          <span className="kl-stat-val">{keywords.length}</span>
          <span className="kl-stat-label">High-Intent Entities</span>
        </div>
        <div className="kl-stat">
          <span className="kl-stat-val">
            <Activity size={18} style={{marginRight: '6px', color: 'var(--brand)'}} />
            {Math.round(keywords.reduce((s, k) => s + (parseInt(k.diff) || 0), 0) / keywords.length)}
          </span>
          <span className="kl-stat-label">Avg. Difficulty</span>
        </div>
      </div>

      <div className="kl-list">
        {keywords.map((k, i) => {
          const intentKey = Object.keys(INTENT_MAP).find(key => k.intent?.includes(key)) || "Informational";
          const intentCfg = INTENT_MAP[intentKey];
          const IntentIcon = intentCfg.icon;

          return (
            <div key={i} className="kl-row-card">
              
              <div className="kl-rank-tag">#{i + 1}</div>
              
              <div className="kl-main-col">
                <h4 className="kl-kw-title">{k.kw}</h4>
                <div className="kl-intent-badge" style={{ color: intentCfg.color }}>
                  <IntentIcon size={12} strokeWidth={2.5} />
                  <span>{k.intent}</span>
                </div>
              </div>

              <div className="kl-metrics-col">
                <div className="kl-metric">
                  <span className="kl-m-label">Diff</span>
                  <span className="kl-m-val" style={{ color: getDiffColor(k.diff) }}>
                    {k.diff}<span className="kl-m-sub">/100</span>
                  </span>
                </div>
                <div className="kl-metric">
                  <span className="kl-m-label">Potential</span>
                  <span className="kl-m-val" style={{ color: k.pot?.toLowerCase().includes('high') ? 'var(--brand)' : 'var(--text-secondary)' }}>
                    {k.pot}
                  </span>
                </div>
              </div>

              <button 
                className="kl-action-btn"
                onClick={() => handleCopy(k.kw, i)}
                title="Copy Title"
              >
                {copiedIndex === i ? <CheckCircle2 size={14} color="var(--green)" /> : <Copy size={14} />}
              </button>

            </div>
          );
        })}
      </div>
    </div>
  );
}
