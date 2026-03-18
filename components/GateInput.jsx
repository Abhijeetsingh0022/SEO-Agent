"use client";
import { useState } from "react";
import { Send } from "lucide-react";

export default function GateInput({ prompt, hint, placeholder, onSubmit }) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    const v = value.trim();
    if (!v || submitted) return;
    setSubmitted(true);
    onSubmit(v);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  return (
    <div className="gate-box">
      <div className="gate-prompt">
        <span className="gate-chevron">›</span>
        {prompt}
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
        <button className="btn-gate" onClick={submit} disabled={submitted || !value.trim()}>
          <Send size={15} strokeWidth={2} />
          {submitted ? "Sent" : "Continue"}
        </button>
      </div>
      {hint && <p className="gate-hint">{hint}</p>}
    </div>
  );
}
