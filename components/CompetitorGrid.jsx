import React, { useState } from "react";
import { Copy, Target, Flame, Lightbulb, ChevronRight, CheckCircle2, Bookmark, ShieldAlert, Zap, Award, BarChart3, Radio } from "lucide-react";

export default function CompetitorGrid({ text }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!text) return null;

  // Split by competitor header - Support both ### and 1. style
  const rawSections = text.split(/(?=###\s+|\d+\.\s+)/i);

  const competitors = rawSections.map((section, idx) => {
    const hasKeywords = ["focus", "insight", "move", "quality", "assessment"].some(k => section.toLowerCase().includes(k));
    if (!hasKeywords) return null;

    const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return null;
    
    // Header parsing
    const headerLine = lines[0].replace(/^###\s*/, '').replace(/^\d+\.\s*/, '').trim();
    const parts = headerLine.split(/[-–—]/);
    const competitorName = parts[0] ? parts[0].replace(/[\[\]\*\*]/g, '').trim() : "Competitor";
    const postTitleMatch = headerLine.match(/["'“‘](.*?)["'”’]/);
    const postTitle = postTitleMatch ? postTitleMatch[1] : (parts.slice(1).join('-').replace(/\(.*\)/, '').trim() || "Strategy Analysis");
    const dateMatch = headerLine.match(/\((.*?)\)/);
    const postDate = dateMatch ? dateMatch[1] : null;

    let focus = "";
    let angles = [];
    let insight = "";
    let idea = "";
    let quality = "";
    let qualityRating = "FAIR"; 
    let vulnerability = "";
    let riskLevel = "MODERATE"; 

    let currentSection = "";

    lines.slice(1).forEach(line => {
      const lower = line.toLowerCase();
      const clean = line.replace(/\*\*/g, '').replace(/^[\-\*\d\.]+\s*/, '').trim();
      
      if (lower.includes("focus:")) {
        currentSection = "focus";
        focus = line.replace(/^.*?focus:\s*/i, '').replace(/\*\*/g, '').trim();
      } 
      else if (lower.includes("insight:")) {
        currentSection = "insight";
        insight = line.replace(/^.*?insight:\s*/i, '').replace(/\*\*/g, '').trim();
      } 
      else if (lower.includes("counter-move:")) {
        currentSection = "idea";
        idea = line.replace(/^.*?counter-move:\s*/i, '').replace(/\*\*/g, '').replace(/["'”]/g, '').trim();
      } 
      else if (lower.includes("quality signal:")) {
        currentSection = "quality";
        quality = line.replace(/^.*?quality signal:\s*/i, '').replace(/\*\*/g, '').trim();
        if (quality.toLowerCase().includes("exceptional")) qualityRating = "EXCEPTIONAL";
        else if (quality.toLowerCase().includes("good")) qualityRating = "GOOD";
        else if (quality.toLowerCase().includes("poor")) qualityRating = "POOR";
      }
      else if (lower.includes("assessment:")) {
        currentSection = "vulnerability";
        vulnerability = line.replace(/^.*?assessment:\s*/i, '').replace(/\*\*/g, '').trim();
        if (vulnerability.toLowerCase().includes("low")) riskLevel = "LOW RISK";
        else if (vulnerability.toLowerCase().includes("high")) riskLevel = "HIGH RISK";
      }
      else if (lower.includes("angles identified:")) {
        currentSection = "angles";
      } 
      else {
        if (currentSection === "angles") {
          if (clean.length > 5 && !clean.toLowerCase().includes("insight:")) angles.push(clean);
        } else if (currentSection === "focus" && !focus) focus = clean;
        else if (currentSection === "insight" && !insight) insight = clean;
        else if (currentSection === "idea" && !idea) idea = clean;
        else if (currentSection === "quality" && !quality) quality = clean;
        else if (currentSection === "vulnerability" && !vulnerability) vulnerability = clean;
      }
    });

    return { competitorName, postTitle, postDate, focus, angles, insight, idea, quality, qualityRating, vulnerability, riskLevel };
  }).filter(Boolean);

  if (competitors.length === 0) return <div className="sc-markdown">{text}</div>;

  const handleCopy = (txt, idx) => {
    navigator.clipboard.writeText(txt);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-ci-container">
      {competitors.map((comp, idx) => (
        <div key={idx} className="min-ci-card">
          
          {/* Top: Metadata & Rating Row */}
          <div className="min-ci-meta">
            <div className="min-ci-brand">
              <strong>{comp.competitorName}</strong>
              <span className="min-ci-date">{comp.postDate}</span>
            </div>
            <div className="min-ci-badges">
              <span className={`min-pill q-${comp.qualityRating.toLowerCase()}`}>{comp.qualityRating}</span>
              <span className={`min-pill r-${comp.riskLevel.toLowerCase().replace(' ', '')}`}>{comp.riskLevel}</span>
            </div>
          </div>

          {/* Title and Direct Focus */}
          <div className="min-ci-intro">
            <h3 className="min-ci-title">"{comp.postTitle}"</h3>
            {comp.focus && <p className="min-ci-focus">{comp.focus}</p>}
          </div>

          <div className="min-ci-divider" />

          {/* Content Grid */}
          <div className="min-ci-grid">
            <div className="min-ci-col">
              <h4 className="min-ci-label">Tactical Angles</h4>
              <ul className="min-ci-list">
                {comp.angles.map((a, i) => (
                  <li key={i}><ChevronRight size={12} /> <span>{a}</span></li>
                ))}
              </ul>
            </div>
            <div className="min-ci-col">
              <h4 className="min-ci-label">March 2026 Audit</h4>
              <div className="min-ci-audit">
                <div><strong>Signal:</strong> {comp.quality}</div>
                <div><strong>Risk:</strong> {comp.vulnerability}</div>
              </div>
            </div>
          </div>

          {/* Bottom Area: Insight & Action */}
          <div className="min-ci-footer">
            <div className="min-ci-insight">
              <Zap size={14} className="text-amber" />
              <span><strong>Insight:</strong> {comp.insight}</span>
            </div>
            
            <div className="min-ci-action">
              <div className="min-ci-action-head">
                <div className="flex-items-center gap-1.5">
                  <Lightbulb size={14} className="text-emerald" />
                  <strong>Counter-Move Title</strong>
                </div>
                <button 
                  className="min-ci-copy"
                  onClick={() => handleCopy(comp.idea, idx)}
                >
                  {copiedIndex === idx ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                  {copiedIndex === idx ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="min-ci-idea">{comp.idea}</p>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
}

