"use client";
import { Check } from "lucide-react";
import { ICON_MAP } from "@/lib/iconMap";

export default function StepTracker({ steps, stepData, progressPct = 0 }) {
  return (
    <div className="tracker-bar">
      <div className="tracker-steps-row">
        {steps.map((step, i) => {
          const sd = stepData[step.id];
          const isDone   = sd?.status === "done";
          const isActive = sd?.status === "loading" || sd?.status === "waiting";
          const Icon = ICON_MAP[step.icon] || ICON_MAP.search;

          return (
            <div key={step.id} className="tracker-item-wrap">
              <div className="tracker-item">
                <div className={`tracker-step ${isDone ? "done" : isActive ? "active" : ""}`}>
                  {isDone
                    ? <Check size={14} strokeWidth={3} />
                    : <Icon size={14} strokeWidth={2} />
                  }
                </div>
                <span className={`tracker-label ${isDone ? "done" : isActive ? "active" : ""}`}>
                  {step.short}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`tracker-line ${isDone ? "done" : ""}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="tracker-footer">
        <div className="tracker-progress-container">
          <div className="tracker-progress-bar">
            <div className="tracker-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="tracker-progress-label">{progressPct}% Complete</p>
        </div>
      </div>
    </div>
  );
}
