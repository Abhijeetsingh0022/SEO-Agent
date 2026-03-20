"use client";
import { Check } from "lucide-react";
import { ICON_MAP } from "@/lib/iconMap";

export default function StepTracker({ steps, stepData, progressPct = 0 }) {
  return (
    <div className="tracker-bar">
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0 }}>
        {steps.map((step, i) => {
          const sd = stepData[step.id];
          const isDone   = sd?.status === "done";
          const isActive = sd?.status === "loading" || sd?.status === "waiting";
          const Icon = ICON_MAP[step.icon] || ICON_MAP.search;

          return (
            <div key={step.id} className="tracker-item">
              <div className={`tracker-step ${isDone ? "done" : isActive ? "active" : ""}`}>
                {isDone
                  ? <Check size={12} strokeWidth={3} />
                  : <Icon size={12} strokeWidth={2} />
                }
              </div>
              <span className={`tracker-label ${isDone ? "done" : isActive ? "active" : ""}`}>
                {step.short}
              </span>
              {i < steps.length - 1 && (
                <div className={`tracker-line ${isDone ? "done" : ""}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="tracker-progress-bar">
        <div className="tracker-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="tracker-progress-label">{progressPct}% Complete</p>
    </div>
  );
}
