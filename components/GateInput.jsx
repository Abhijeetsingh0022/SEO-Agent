"use client";
import { useState, useRef } from "react";
import { Send, MessageSquare } from "lucide-react";
import { SecureSanitizer } from "@/lib/secureSanitizer";
import TopicSelector from "./TopicSelector";

export default function GateInput({ gate, onSubmit, text, stepId }) {
  const { type, prompt, hint, placeholder, suggestions, onSubmit: gateOnSubmit } = gate || {};
  const finalOnSubmit = gateOnSubmit || onSubmit;
  
  // Route topic-select to dedicated selector component
  if (type === "topic-select") {
    return (
      <div className="gate-box">
        <div className="gate-header">
          <div className="gate-header-left">
            <div className="gate-icon"><MessageSquare size={13} strokeWidth={2.5} className="text-brand" /></div>
            <p className="gate-prompt">{prompt}</p>
          </div>
          {suggestions?.length > 0 && (
            <div className="gate-suggestions">
              {suggestions.map((s, idx) => (
                <button key={idx} className="gate-pill" onClick={() => finalOnSubmit(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <TopicSelector text={text} onSubmit={(val) => finalOnSubmit(val)} />
      </div>
    );
  }
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const submitRef = useRef(false);

  function sanitizeInput(str) {
    try {
      const analysis = SecureSanitizer.checkInputComplexity(str);
      if (analysis.isSuspicious) {
        console.warn("Suspicious input detected:", analysis.reason);
      }
      return SecureSanitizer.sanitizePromptInput(str);
    } catch (e) {
      throw new Error(e.message);
    }
  }

  function submit() {
    const v = value.trim();
    if (!v || submitRef.current || submitted) return;
    submitRef.current = true;
    try {
      const sanitized = sanitizeInput(v);
      if (!sanitized || sanitized.length === 0) {
        setError("Input is empty or invalid");
        submitRef.current = false;
        return;
      }
      setSubmitted(true);
      setError("");
      finalOnSubmit(sanitized);
    } catch (err) {
      setError(err.message);
      submitRef.current = false;
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  return (
    <div className="gate-box">
      <div className="gate-header">
        <div className="gate-header-left">
          <div className="gate-icon">
            <MessageSquare size={13} strokeWidth={2.5} className="text-brand" />
          </div>
          <p className="gate-prompt">{prompt}</p>
        </div>
        
        {/* Suggestion Pills - Proactive AI Recommendations */}
        {suggestions?.length > 0 && !submitted && (
          <div className="gate-suggestions">
            {suggestions.map((s, idx) => (
              <button key={idx} className="gate-pill" onClick={() => { setValue(s); setTimeout(() => submit(), 50); }}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="gate-row">
        <input
          className="gate-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder || "Type your response…"}
          disabled={submitted}
          autoFocus
        />
        <button
          className="btn-gate"
          onClick={submit}
          disabled={submitted || !value.trim()}
        >
          <Send size={13} strokeWidth={2} />
          {submitted ? "Sent" : "Continue"}
        </button>
      </div>
      {error && (
        <p className="gate-hint" style={{ color: "var(--red)" }}>{error}</p>
      )}
      {hint && !error && <p className="gate-hint">{hint}</p>}
    </div>
  );
}
