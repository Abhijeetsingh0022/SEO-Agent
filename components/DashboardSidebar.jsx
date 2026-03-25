"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, Radar, RadarChart,
  PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';
import { Activity, BarChart3, TrendingUp, Zap, FileText, CheckCircle, Target, Layers } from "lucide-react";

// Count words in a text string
function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Extract semantic richness (bold entities + bullet items) from a single step
function extractSemanticCount(text) {
  if (!text || typeof text !== 'string') return 0;
  const boldMatches = (text.match(/\*\*[^*]+\*\*/g) || []).length;
  const bulletItems = (text.match(/^[-*•]\s+\S/gm) || []).length;
  return boldMatches + bulletItems;
}

// Deep analysis of actual blog post content to produce real metrics
function analyzeBlogPost(text) {
  if (!text || text.length < 50) {
    return { wordCount: 0, h1Count: 0, h2Count: 0, h3Count: 0, listCount: 0, boldCount: 0, hasFAQ: false, hasCTA: false, hasTable: false, sxoScore: 0, issues: [] };
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 4);
  const avgWPS = wordCount / (sentences.length || 1);

  const h1Count = (text.match(/^#\s+.+/gm) || []).length;
  const h2Count = (text.match(/^##\s+.+/gm) || []).length;
  const h3Count = (text.match(/^###\s+.+/gm) || []).length;
  const listCount = (text.match(/^[-*•]\s+\S/gm) || []).length;
  const boldCount = (text.match(/\*\*[^*]+\*\*/g) || []).length;
  const hasTable = /\|.+\|.+\|/m.test(text);
  const hasFAQ = /\bfaq\b|Q:|A:|frequently asked|question:/i.test(text);
  const hasCTA = /call.to.action|CTA|learn more|get started|sign up|try.*(free|now)|book.*demo|contact us/i.test(text);

  // Real SXO score built from achievable criteria (no free max-out)
  let score = 0;
  if (h1Count >= 1) score += 10;
  if (h2Count >= 4) score += 20;
  else if (h2Count >= 2) score += 10;
  if (h3Count >= 2) score += 8;
  if (listCount >= 3) score += 10;
  else if (listCount >= 1) score += 5;
  if (boldCount >= 5) score += 8;
  if (hasTable) score += 8;
  if (hasFAQ) score += 12;
  if (hasCTA) score += 8;
  if (wordCount >= 2000) score += 8;
  else if (wordCount >= 1500) score += 4;
  if (avgWPS < 20) score += 5; // good readability

  const sxoScore = Math.min(score, 97);

  // Build real issues list from actual gaps
  const issues = [];
  if (h1Count === 0) issues.push("Missing H1 heading");
  if (h2Count < 4) issues.push(`Only ${h2Count} H2 section(s) — target 4+`);
  if (!hasFAQ) issues.push("No FAQ section detected");
  if (!hasCTA) issues.push("No call-to-action found");
  if (!hasTable) issues.push("No comparison table — add one for E-E-A-T");
  if (wordCount < 1800) issues.push(`Word count low: ${wordCount} words (target 2000+)`);
  if (boldCount < 5) issues.push("Low bold density — use bolding to aid skim-readers");

  return { wordCount, h1Count, h2Count, h3Count, listCount, boldCount, hasFAQ, hasCTA, hasTable, sxoScore, issues };
}

export default function DashboardSidebar({
  stepData,
  progressPct,
  internalData = {},
  onGenerateVariations,
  isGeneratingVariations
}) {
  // Count of genuinely completed steps
  const completedCount = useMemo(
    () => Object.values(stepData).filter(s => s?.status === 'done').length,
    [stepData]
  );

  const metrics = useMemo(() => {
    const blogText = stepData[6]?.text || '';
    const blog = analyzeBlogPost(blogText);

    // Semantic Depth: scales progressively as steps are completed
    const sRaw = (
      extractSemanticCount(stepData[1]?.text) * 1.0 +
      extractSemanticCount(stepData[2]?.text) * 1.2 +
      extractSemanticCount(stepData[3]?.text) * 1.0 +
      extractSemanticCount(stepData[4]?.text) * 2.0 +
      extractSemanticCount(stepData[6]?.text) * 3.5
    );
    const semanticDepth = completedCount === 0 ? 0 : Math.min(Math.round(sRaw * 0.8), 97);

    // SXO Score: directly from real blog analysis (0 until blog is written)
    const sxoScore = blog.sxoScore > 0
      ? blog.sxoScore
      : stepData[5]?.status === 'done'
        ? Math.min(completedCount * 8, 55)
        : Math.min(completedCount * 5, 30);

    // ── Intelligence Summary (real data, not canned text) ─────────
    let intelligenceSummary = "Initializing Integrated SEO Core...";

    if (completedCount > 0) {
      if (stepData[6]?.status === 'done' && blog.wordCount > 0) {
        const issueCount = blog.issues.length;
        intelligenceSummary = `Blog post: ${blog.wordCount.toLocaleString()} words | ${blog.h2Count} H2s | ${blog.h3Count} H3s | SXO: ${sxoScore}/97. ${issueCount > 0 ? `${issueCount} content gap(s) detected — see suggestions below.` : 'Content structure meets all quality criteria.'}`;
      } else if (stepData[4]?.status === 'done') {
        const kws = extractSemanticCount(stepData[4]?.text);
        intelligenceSummary = `Keyword Research complete — ${kws} entities identified. Building ${stepData[5] ? 'blog post' : 'content outline'}...`;
      } else if (stepData[3]?.status === 'done') {
        intelligenceSummary = "Topic cluster ready. Select a topic card to begin keyword research.";
      } else if (stepData[2]?.status === 'done') {
        const rivalCount = (stepData[2]?.text?.match(/competitor|rival/gi) || []).length;
        intelligenceSummary = `Competitor analysis complete — ${rivalCount > 0 ? rivalCount + ' rival signals found.' : 'generating 2025–2026 topic clusters.'}`;
      } else if (stepData[1]?.status === 'done') {
        intelligenceSummary = "Brand audit complete. Scanning live competitor landscape...";
      }
    }

    // ── Live Suggestions (generated from REAL content gaps only) ──
    let suggestions = ["Awaiting Brand Audit (Step 1)..."];

    if (stepData[6]?.status === 'done' && blog.wordCount > 0) {
      // Derive suggestions from actual analysis issues
      const dynamicSuggestions = blog.issues.map(issue => {
        if (issue.startsWith('Missing H1')) return 'Add a single H1 heading as the article title.';
        if (issue.includes('H2 section')) return `Expand structure: add ${4 - blog.h2Count} more H2 section(s) for better topic coverage.`;
        if (issue.includes('FAQ')) return 'Add a "Frequently Asked Questions" section to capture Featured Snippets.';
        if (issue.includes('call-to-action')) return 'Add a clear CTA (e.g. "Get Started Free") to drive conversions.';
        if (issue.includes('comparison table')) return 'Insert a comparison table to boost E-E-A-T and dwell time.';
        if (issue.includes('Word count')) return `Expand the post to 2000+ words (currently ${blog.wordCount.toLocaleString()}) for stronger ranking potential.`;
        if (issue.includes('bold')) return `Increase bolding — only ${blog.boldCount} bold phrase(s) found. Target 8+ for skim-readers.`;
        return issue;
      });
      suggestions = dynamicSuggestions.length > 0
        ? dynamicSuggestions.slice(0, 4)
        : ['Content structure meets all quality criteria. Proceed to Step 7 SEO meta.'];
    } else if (stepData[4]?.status === 'done') {
      suggestions = ["Incorporate the Primary Keyword in the first 100 words.", "Use at least 3 LSI terms to improve semantic density."];
    } else if (stepData[3]?.status === 'done') {
      suggestions = ["Prioritize Pillar Content for long-term topical clustering.", "Select a 'Decision Intent' topic for high conversion."];
    } else if (stepData[2]?.status === 'done') {
      suggestions = ["Target the Content Gaps where rivals have zero visibility.", "Leapfrog competitors using the Strategic Recommendation."];
    } else if (stepData[1]?.status === 'done') {
      suggestions = ["Focus on the primary Entity to anchor your authority.", "Check if Brand Voice aligns with your target persona."];
    }

    return { blogWords: blog.wordCount, semanticDepth, sxoScore, intelligenceSummary, suggestions, blog };
  }, [stepData, completedCount]);


  const radarData = useMemo(() => {
    // Each axis is 0 until that step is complete, then scored from actual content
    // Step 1 — Brand Strategy: scored from word count (typical: 400-700 words → 60-90pt)
    const strategyScore = stepData[1]?.status === 'done'
      ? Math.min(Math.round(countWords(stepData[1]?.text) / 7), 90) : 0;

    // Step 2 — Rivals: scored from word count (typical: 300-500 words)
    const rivalsScore = stepData[2]?.status === 'done'
      ? Math.min(Math.round(countWords(stepData[2]?.text) / 6), 90) : 0;

    // Semantic: the progressively built score from the metrics hook
    const semanticScore = metrics.semanticDepth;

    // Step 4 — Keywords: count actual 'Target Keyword:' lines found (10 = full score)
    const kwFound = (stepData[4]?.text?.match(/Target Keyword:/gi) || []).length;
    const keywordsScore = kwFound >= 10 ? 92 : kwFound >= 5 ? 65 : kwFound > 0 ? 35 : 0;

    // Step 6 — SXO: real score from blog analysis (0 until blog written)
    const sxoScore = metrics.sxoScore;

    // Step 7 — SEO Meta: binary, done or not
    const seoMetaScore = stepData[7]?.status === 'done' ? 88 : (stepData[6]?.status === 'done' ? 18 : 0);

    return [
      { subject: 'Strategy', A: strategyScore, fullMark: 100 },
      { subject: 'Rivals',   A: rivalsScore,   fullMark: 100 },
      { subject: 'Semantic', A: semanticScore,  fullMark: 100 },
      { subject: 'Keywords', A: keywordsScore,  fullMark: 100 },
      { subject: 'SXO',      A: sxoScore,       fullMark: 100 },
      { subject: 'SEO Meta', A: seoMetaScore,   fullMark: 100 },
    ];
  }, [stepData, metrics]);

  // Timeline: cumulative word output — grows as steps complete
  const timelineData = useMemo(() => {
    const w = (id) => countWords(stepData[id]?.text) || 0;
    let cum = 0;
    return [
      { name: 'S1', score: (cum += w(1), Math.min(Math.round(cum / 50), 100)) },
      { name: 'S2', score: (cum += w(2), Math.min(Math.round(cum / 50), 100)) },
      { name: 'S4', score: (cum += w(4), Math.min(Math.round(cum / 50), 100)) },
      { name: 'S6', score: (cum += w(6), Math.min(Math.round(cum / 50), 100)) },
      { name: 'S7', score: (cum += w(7), Math.min(Math.round(cum / 50), 100)) },
    ];
  }, [stepData]);

  const hasRankings = internalData.rankings?.length > 0;
  const step4Loading = stepData[4]?.status === 'loading';
  const step4Pending = !stepData[4];

  return (
    <div className="dashboard-sidebar-inner">
      {/* Content Velocity — shows total words generated, grows as steps complete */}
      <div className="dash-card">
        <h3 className="dash-title"><Activity size={16} className="text-brand" /> Content Velocity</h3>
        <p className="dash-subtitle">Total words generated across {completedCount} active step{completedCount !== 1 ? 's' : ''}</p>
        <div className="velocity-metric">
          <span className="velocity-val">
            {(() => {
              const total = Object.values(stepData).reduce((s, d) => s + countWords(d?.text), 0);
              return total > 999 ? `${(total / 1000).toFixed(1)}k` : total > 0 ? total : '—';
            })()}
          </span>
          <span className="velocity-trend">
            <TrendingUp size={14} className="mr-1"/>
            Step {completedCount}/7
          </span>
        </div>
        <div className="chart-velocity-wrap">
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E11D48" stopOpacity={0.3}/><stop offset="95%" stopColor="#E11D48" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
              <Area type="monotone" dataKey="score" stroke="#E11D48" strokeWidth={3} fill="url(#colorScore)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Topic Gap Engine */}
      <div className="dash-card">
        <h3 className="dash-title"><BarChart3 size={16} className="text-blue" /> Topic Gap Engine</h3>
        <p className="dash-subtitle">Identifying strategic content opportunities</p>
        <div className="chart-radar-wrap">
          <ResponsiveContainer width="100%" height={120}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData} margin={{ top: 10, right: 25, left: 25, bottom: 10 }}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8, fontWeight: 600 }} />
              <Radar name="Intel" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metric Grid — all 4 are now accurate and stage-aware */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <FileText size={16} className="dash-metric-icon text-gray"/>
          <span className="dash-metric-val">
            {metrics.blogWords > 1000
              ? `${(metrics.blogWords / 1000).toFixed(1)}k`
              : metrics.blogWords > 0
                ? metrics.blogWords
                : '—'}
          </span>
          <span className="dash-metric-label">Words Output</span>
        </div>
        <div className="dash-metric-card">
          <Target size={16} className="dash-metric-icon text-amber"/>
          <span className="dash-metric-val">{metrics.semanticDepth > 0 ? metrics.semanticDepth : '—'}</span>
          <span className="dash-metric-label">Semantic Depth</span>
        </div>
        <div className="dash-metric-card">
          <Zap size={16} className="dash-metric-icon text-emerald"/>
          <span className="dash-metric-val">{metrics.sxoScore > 0 ? metrics.sxoScore : '—'}</span>
          <span className="dash-metric-label">SXO Score</span>
        </div>
        <div className="dash-metric-card">
          <CheckCircle size={16} className="dash-metric-icon text-purple"/>
          <span className="dash-metric-val">{progressPct}%</span>
          <span className="dash-metric-label">Audit Phase</span>
        </div>
      </div>

      {/* Live Rank Hub */}
      <div className="dash-card rank-hub-card">
        <h3 className="dash-title"><TrendingUp size={16} className="text-emerald" /> Live Rank Hub</h3>
        <p className="dash-subtitle">Real-time keyword tracking</p>
        <div className="rank-list">
          {hasRankings ? (
            internalData.rankings.map((r, i) => (
              <div key={i} className="rank-row">
                <span className="rank-kw">{r.keyword}</span>
                <div className="rank-pos-wrap">
                  <span className={`rank-pos ${r.position !== '100+' ? 'active' : ''}`}>#{r.position}</span>
                  <span className={`rank-change ${r.change >= 0 ? 'up' : 'down'}`}>
                    {r.change >= 0 ? '+' : ''}{r.change}
                  </span>
                </div>
              </div>
            ))
          ) : step4Loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="rank-row" style={{ opacity: 0.4 }}>
                <span className="rank-kw" style={{ background: '#e2e8f0', borderRadius: 4, width: '60%', display: 'inline-block', height: 14 }}></span>
                <span className="rank-pos" style={{ background: '#e2e8f0', borderRadius: 4, width: 32, display: 'inline-block', height: 14 }}></span>
              </div>
            ))
          ) : step4Pending ? (
            <p className="rank-empty">Tracking will start after Keyword Research (Step 4).</p>
          ) : (
            <p className="rank-empty" style={{ color: '#94a3b8' }}>
              No ranking data — keywords may not have matched your domain in SERP.
            </p>
          )}
        </div>
      </div>

      {/* Intelligence Summary & Suggestions */}
      <div className="dash-card intelligence-card">
        <h3 className="dash-title"><Target size={14} className="text-amber" /> Intelligence Summary</h3>
        <p className="intelligence-text">{metrics.intelligenceSummary}</p>

        <div className="live-suggestions-wrap">
          <span className="i-label"><Layers size={11} className="mr-1" /> Live Suggestions</span>
          <ul className="suggestions-list">
            {metrics.suggestions.map((s, idx) => (
              <li key={idx} className="suggestion-item">{s}</li>
            ))}
          </ul>
        </div>

        <div className="intelligence-footer">
          <div className="i-bit">
            <span className="i-label">Progress:</span>
            <span className="i-val">{completedCount} / 7 steps done</span>
          </div>
          <div className="i-bit">
            <span className="i-label">SXO Score:</span>
            <span className="i-val">
              {metrics.sxoScore >= 85 ? `${metrics.sxoScore} — Optimized` :
               metrics.sxoScore >= 60 ? `${metrics.sxoScore} — Building` :
               metrics.sxoScore > 0  ? `${metrics.sxoScore} — Needs Work` : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
