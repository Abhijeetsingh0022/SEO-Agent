"use client";

import React, { useState } from "react";
import { Copy, Target, Flame, Lightbulb, ChevronRight, CheckCircle2, Bookmark } from "lucide-react";

export default function CompetitorGrid({ text }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!text) return null;

  // Split by competitor header (`### ` or `1. ` if the LLM hallucinated)
  // We'll use a split that looks for markdown headers or numbered lists that appear like competitor titles
  const rawSections = text.split(/(?=###\s+)/i);

  const competitors = rawSections.map((section, idx) => {
    // If this section doesn't contain at least one of our keywords, skip it (it's intro text)
    if (!section.toLowerCase().includes("focus") && !section.toLowerCase().includes("insight")) {
      return null;
    }

    const lines = section.split('\n').filter(l => l.trim().length > 0);
    
    // Header parsing
    const headerLine = lines[0].replace(/^###\s*/, '').replace(/^\d+\.\s*/, '').trim();
    const nameMatch = headerLine.split(/[-–—]/);
    const competitorName = nameMatch[0] ? nameMatch[0].replace(/\*\*/g, '').trim() : "Competitor";
    const postTitleMatch = headerLine.match(/["'“‘](.*?)["'”’]/);
    const postTitle = postTitleMatch ? postTitleMatch[1] : (nameMatch.slice(1).join('-').trim() || "Analysis");

    let focus = "";
    let topics = [];
    let insight = "";
    let idea = "";

    let inTopics = false;

    lines.slice(1).forEach(line => {
      const lower = line.toLowerCase();
      
      if (lower.includes("focus:")) {
        inTopics = false;
        focus = line.replace(/^.*?focus:\s*/i, '').replace(/\*\*/g, '').trim();
      } 
      else if (lower.includes("insight for you:")) {
        inTopics = false;
        insight = line.replace(/^.*?insight for you:\s*/i, '').replace(/[➡️\*\*]/g, '').trim();
      } 
      else if (lower.includes("example blog idea:")) {
        inTopics = false;
        idea = line.replace(/^.*?example blog idea:\s*/i, '').replace(/[💡\*\*]/g, '').replace(/["'”]/g, '').trim();
      } 
      else if (lower.includes("key topics covered")) {
        inTopics = true;
      } 
      else if (inTopics && (line.trim().startsWith("-") || line.trim().startsWith("*") || /^\d+\./.test(line.trim()) || line.trim().length > 10)) {
         // Grab bullet points or any substantial line while in topics mode
         const cleanTopic = line.replace(/^[\-\*\d\.]+\s*/, '').trim();
         if (cleanTopic.toLowerCase() !== "key topics covered:" && !cleanTopic.toLowerCase().includes("insight for you")) {
            topics.push(cleanTopic);
         }
      }
    });

    return { id: idx, competitorName, postTitle, focus, topics, insight, idea };
  }).filter(Boolean); // Remove nulls (like intos)

  // If strict parsing completely failed, we shouldn't just crash. But with the user's example, it should work perfectly.
  if (competitors.length === 0) {
     return <div className="sc-markdown">{text}</div>;
  }

  const handleCopy = (txt, idx) => {
    navigator.clipboard.writeText(txt);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="competitor-list-wrap">
      <div className="cl-list">
        {competitors.map((comp, idx) => (
          <div key={idx} className="cl-card">
            
            <div className="cl-card-header">
               <div className="cl-meta-row">
                 <Bookmark size={14} className="cl-meta-icon" />
                 <span className="cl-comp-name">{comp.competitorName}</span>
               </div>
               <h3 className="cl-post-title">"{comp.postTitle}"</h3>
            </div>

            {comp.focus && (
              <div className="cl-focus-box">
                <Target size={15} className="cl-icon-target" />
                <div className="cl-focus-content">
                  <span className="cl-label">Strategic Focus</span>
                  <p>{comp.focus}</p>
                </div>
              </div>
            )}

            {comp.topics.length > 0 && (
              <div className="cl-topics">
                <span className="cl-label">Key Topics Covered</span>
                <ul>
                  {comp.topics.map((t, i) => (
                     <li key={i}><ChevronRight size={14} className="cl-bullet-icon" /> {t}</li>
                  ))}
                </ul>
              </div>
            )}

            {comp.insight && (
              <div className="cl-insight">
                <div className="cl-insight-header">
                  <Flame size={14} color="#ff6b00" style={{marginTop: '-2px'}} />
                  <span>Actionable Insight</span>
                </div>
                <p>{comp.insight}</p>
              </div>
            )}

            {comp.idea && (
               <div className="cl-idea-box">
                 <div className="cl-idea-header">
                   <div className="cl-idea-title">
                     <Lightbulb size={14} className="cl-idea-icon" />
                     <span>Idea to Outrank</span>
                   </div>
                   <button 
                     className="cl-copy-btn" 
                     onClick={() => handleCopy(comp.idea, idx)}
                   >
                     {copiedIndex === idx ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                     {copiedIndex === idx ? 'Copied' : 'Copy Title'}
                   </button>
                 </div>
                 <p className="cl-idea-text">{comp.idea}</p>
               </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}

