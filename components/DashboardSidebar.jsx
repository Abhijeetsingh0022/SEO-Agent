"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, Radar, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';
import { Activity, BarChart3, TrendingUp, Zap, FileText, CheckCircle, Target, Layers } from "lucide-react";

// Count words in a text string
function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Extract keywords/entities/LSIs from text
function extractSemanticCount(text) {
  if (!text || typeof text !== 'string') return 0;
  // Look for bold terms (entities/LSIs usually highlighted) and bullet points
  const boldMatches = (text.match(/\*\*[^*]+\*\*/g) || []).length;
  const bulletItems = (text.match(/^[-*•]\s+\S/gm) || []).length;
  return Math.min(boldMatches + bulletItems, 80);
}

// Search Experience Optimization (SXO) Score
function calculateSXO(text) {
  if (!text || text.length < 100) return 0;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.trim().split(/\s+/).filter(Boolean);
  const headings = (text.match(/^#{1,4}\s+/gm) || []).length;
  const lists = (text.match(/^[-*•]\s+\S/gm) || []).length;
  
  if (words.length === 0) return 0;

  const avgWPS = words.length / (sentences.length || 1);
  const scannability = Math.min((headings * 5) + (lists * 2), 40);
  const readability = Math.max(0, 60 - (avgWPS - 15) * 2);

  return Math.min(Math.round(scannability + readability), 98);
}

// Compute depth score for radar
function depthScore(text) {
  if (!text) return 0;
  const words = countWords(text);
  if (words > 1000) return 98;
  if (words > 500) return 85;
  if (words > 200) return 60;
  return 30;
}

export default function DashboardSidebar({ 
  stepData, 
  progressPct, 
  internalData = {},
  onGenerateVariations,
  isGeneratingVariations
}) {
  const metrics = useMemo(() => {
    const totalWords = Object.values(stepData).reduce((sum, step) => sum + countWords(step?.text), 0);
    
    // Aggregate semantic counts across all available steps to ensure live updates from Step 1
    const s1 = extractSemanticCount(stepData[1]?.text);
    const s2 = extractSemanticCount(stepData[2]?.text);
    const s3 = extractSemanticCount(stepData[3]?.text);
    const s4 = extractSemanticCount(stepData[4]?.text);
    const s6 = extractSemanticCount(stepData[6]?.text);
    const semanticDepth = internalData.radar?.semantic || (s1 * 1.5 + s2 * 1.2 + s3 * 1.2 + s4 * 2.5 + s6 * 3.0);
    
    // Estimate SXO score from early steps then refine with Step 6
    const sxoScore = internalData.radar?.sxo || (stepData[6]?.text ? calculateSXO(stepData[6]?.text) : Math.min((s1 + s2 + s3) * 1.5, 60));
    
    const completedSteps = Object.values(stepData).filter(s => s?.status === 'done').length;
    const velocity = progressPct === 0 ? 0 : Math.min(Math.round((completedSteps / 7) * 100 + (totalWords / 120)), 100);

    // Dynamic Intelligence Summary
    let intelligenceSummary = "Initializing Integrated SEO Core...";
    let suggestions = ["Awaiting Brand Audit (Step 1)..."];

    if (progressPct > 0) {
      if (semanticDepth > 80) intelligenceSummary = "Exceptional topical authority. Content is rich with competitive LSIs and entities.";
      else if (progressPct < 50) intelligenceSummary = `SEO Core Phase ${Math.ceil(progressPct/14)}: Analyzing keyword difficulty and rival content gaps.`;
      else intelligenceSummary = "Topic selection complete. Generating human-first SXO blog post.";

      // Step-specific live suggestions
      if (stepData[1]?.status === 'done') suggestions = ["Focus on the primary Entity identified to anchor your authority.", "Check if your Brand Voice aligns with your target persona (The tech Lead)."];
      if (stepData[2]?.status === 'done') suggestions = ["Target the 'Content Gaps' where rivals have zero visibility.", "Leapfrog competitors using the 'Strategic Recommendation' found."];
      if (stepData[3]?.status === 'done') suggestions = ["Prioritize 'Pillar Content' for long-term topical clustering.", "Select a topic with 'Decision Intent' for high conversion."];
      if (stepData[4]?.status === 'done') suggestions = ["Incorporate the Primary Keyword in the first 100 words.", "Use at least 3 LSI terms to improve semantic density."];
      if (stepData[6]?.status === 'done') suggestions = ["Enhance scannability with bolding and H2 breakdowns.", "Add an FAQ section to capture Featured Snippets."];
    }

    return { 
      totalWords, 
      semanticDepth: Math.min(Math.round(semanticDepth), 98), 
      sxoScore: Math.min(Math.round(sxoScore), 98), 
      velocity,
      intelligenceSummary,
      suggestions
    };
  }, [stepData, progressPct, internalData.radar]);

  const radarData = useMemo(() => {
    // Subjective but deterministic scores based on actual step content quality
    const s1 = extractSemanticCount(stepData[1]?.text);
    const s2 = extractSemanticCount(stepData[2]?.text);
    const s4 = extractSemanticCount(stepData[4]?.text);
    const s6 = extractSemanticCount(stepData[6]?.text);
    const s7 = extractSemanticCount(stepData[7]?.text);

    return [
      { subject: 'Strategy',    A: Math.min(s1 * 1.5, 95), fullMark: 100 },
      { subject: 'Rivals',      A: Math.min(s2 * 1.5, 95), fullMark: 100 },
      { subject: 'Semantic',    A: metrics.semanticDepth > 0 ? Math.min(metrics.semanticDepth, 95) : 10, fullMark: 100 },
      { subject: 'Keywords',    A: Math.min(s4 * 1.5, 95), fullMark: 100 },
      { subject: 'SXO Power',   A: metrics.sxoScore || Math.min(s6 * 1.5, 95), fullMark: 100 },
      { subject: 'Conversion',  A: Math.min(s7 * 1.5, 95), fullMark: 100 },
    ];
  }, [stepData, metrics.semanticDepth, metrics.sxoScore, internalData.radar]);

  const timelineData = useMemo(() => {
    let cumulative = 0;
    return [
      { name: 'Step 1', score: (() => { cumulative += countWords(stepData[1]?.text); return Math.min(cumulative / 15, 100); })() },
      { name: 'Step 2', score: (() => { cumulative += countWords(stepData[2]?.text); return Math.min(cumulative / 15, 100); })() },
      { name: 'Step 4', score: (() => { cumulative += countWords(stepData[4]?.text); return Math.min(cumulative / 15, 100); })() },
      { name: 'Step 6', score: (() => { cumulative += countWords(stepData[6]?.text); return Math.min(cumulative / 15, 100); })() },
      { name: 'Step 7', score: (() => { cumulative += countWords(stepData[7]?.text); return Math.min(cumulative / 15, 100); })() },
    ];
  }, [stepData]);

  return (
    <div className="dashboard-sidebar-inner">
      {/* Content Velocity */}
      <div className="dash-card">
        <h3 className="dash-title"><Activity size={16} className="text-brand" /> Content Velocity</h3>
        <p className="dash-subtitle">AI Generation Power (Real-time)</p>
        <div className="velocity-metric">
          <span className="velocity-val">{metrics.velocity}</span>
          <span className="velocity-trend">
            <TrendingUp size={14} className="mr-1"/> 
            {metrics.velocity > 0 ? `+${Math.round(metrics.velocity / (progressPct || 1) * 10)}%` : '0%'}
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

      {/* Metric Grid */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <FileText size={16} className="dash-metric-icon text-gray"/>
          <span className="dash-metric-val">{metrics.totalWords > 1000 ? `${(metrics.totalWords/1000).toFixed(1)}k` : metrics.totalWords}</span>
          <span className="dash-metric-label">Words Output</span>
        </div>
        <div className="dash-metric-card">
          <Target size={16} className="dash-metric-icon text-amber"/>
          <span className="dash-metric-val">{metrics.semanticDepth}</span>
          <span className="dash-metric-label">Semantic Depth</span>
        </div>
        <div className="dash-metric-card">
          <Zap size={16} className="dash-metric-icon text-emerald"/>
          <span className="dash-metric-val">{metrics.sxoScore || '—'}</span>
          <span className="dash-metric-label">SXO Score</span>
        </div>
        <div className="dash-metric-card">
          <CheckCircle size={16} className="dash-metric-icon text-purple"/>
          <span className="dash-metric-val">{progressPct}%</span>
          <span className="dash-metric-label">Audit Phase</span>
        </div>
      </div>

      {/* Live Rank Hub (New Integrated Tracker) */}
      <div className="dash-card rank-hub-card">
        <h3 className="dash-title"><TrendingUp size={16} className="text-emerald" /> Live Rank Hub</h3>
        <p className="dash-subtitle">Real-time keyword tracking</p>
        <div className="rank-list">
          {internalData.rankings?.length > 0 ? (
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
          ) : (
            <p className="rank-empty">Tracking will start after Keyword Research (Step 4).</p>
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
            <span className="i-label">Velocity Insight:</span>
            <span className="i-val">{metrics.velocity > 40 ? 'High Throughput' : 'Nominal'}</span>
          </div>
          <div className="i-bit">
            <span className="i-label">SXO Optimization:</span>
            <span className="i-val">{metrics.sxoScore > 80 ? 'Optimized' : 'Building...'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to extract keywords from Step 4 text
// Helper to extract keywords from Step 4 text
function extractKeywords(text) {
  if (!text) return [];
  // Match text following "Target Keyword:" – skipping labels
  const matches = text.match(/Target Keyword[:\s]+\*{0,2}(.*?)(?:\n|$)/gi) || [];
  return matches.map(m => m.replace(/Target Keyword[:\s]+\*{0,2}/i, '').replace(/\*+$/, '').trim()).filter(t => t.length > 2 && t.length < 50).slice(0, 10);
}

function AlertTiny() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
