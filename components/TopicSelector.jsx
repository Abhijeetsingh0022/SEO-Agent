"use client";
import { useState } from "react";
import { ChevronRight, TrendingDown, TrendingUp, Minus } from "lucide-react";

// Parse topics from the AI markdown text output
function parseTopics(text) {
  const topics = [];
  // Match numbered items: 1. **Title** or 1. Title
  const lines = text.split("\n");
  let current = null;

  for (const line of lines) {
    const numbered = line.match(/^(\d+)\.\s+\*{0,2}(.+?)\*{0,2}\s*$/);
    if (numbered) {
      if (current) topics.push(current);
      current = {
        num: parseInt(numbered[1]),
        title: numbered[2].trim(),
        competition: null,
        intent: null,
      };
      continue;
    }
    if (current) {
      const comp = line.match(/competition[:\s]+\*{0,2}(low|medium|high)\*{0,2}/i);
      if (comp) current.competition = comp[1].toLowerCase();
      const intent = line.match(/intent[:\s]+\*{0,2}(\w+)\*{0,2}/i);
      if (intent) current.intent = intent[1];
    }
  }
  if (current) topics.push(current);
  return topics.slice(0, 10);
}

function CompetitionIcon({ level }) {
  if (level === "low") return <TrendingDown size={11} />;
  if (level === "high") return <TrendingUp size={11} />;
  return <Minus size={11} />;
}

export default function TopicSelector({ text, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const [manualInput, setManualInput] = useState("");
  const topics = parseTopics(text || "");

  function handleSelect(topic) {
    setSelected(topic.num);
    onSubmit(topic.title);
  }

  function handleManual(e) {
    e.preventDefault();
    if (!manualInput.trim()) return;
    onSubmit(manualInput.trim());
  }

  if (topics.length === 0) {
    // Fallback: plain text input if parsing fails
    return (
      <form className="gate-row" onSubmit={handleManual}>
        <input
          className="gate-input"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Enter topic number or paste title…"
          autoFocus
        />
        <button className="btn-gate" type="submit">
          Proceed <ChevronRight size={14} />
        </button>
      </form>
    );
  }

  return (
    <div className="topic-selector">
      <p className="topic-selector-hint">Select a strategic pillar or type a custom topic below</p>
      <div className="topic-list">
        {topics.map((topic) => {
          const compColor =
            topic.competition === "low" ? "#10B981" :
            topic.competition === "high" ? "#EF4444" : "#F59E0B";

          return (
            <button
              key={topic.num}
              className={`topic-card ${selected === topic.num ? "selected" : ""}`}
              onClick={() => handleSelect(topic)}
            >
              <span className="topic-num">#{topic.num}</span>
              <span className="topic-title">{topic.title}</span>
              {topic.competition && (
                <span className="topic-comp" style={{ color: compColor }}>
                  <CompetitionIcon level={topic.competition} />
                  {topic.competition.charAt(0).toUpperCase() + topic.competition.slice(1)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <form className="gate-row mt-4" onSubmit={handleManual}>
        <input
          className="gate-input"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Or type a custom topic…"
        />
        <button className="btn-gate" type="submit" disabled={!manualInput.trim()}>
          Use Custom <ChevronRight size={14} />
        </button>
      </form>
    </div>
  );
}
