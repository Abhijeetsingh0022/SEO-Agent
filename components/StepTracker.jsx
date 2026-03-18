"use client";
import { Check } from "lucide-react";
import {
  Search, BarChart2, Lightbulb, Key, LayoutList, PenLine, Rocket,
} from "lucide-react";

const ICON_MAP = {
  search: Search, "bar-chart-2": BarChart2, lightbulb: Lightbulb,
  key: Key, "layout-list": LayoutList, "pen-line": PenLine, rocket: Rocket,
};

export default function StepTracker({ steps, stepData }) {
  return (
    <div className="tracker-bar">
      {steps.map((step, i) => {
        const sd = stepData[step.id];
        const isDone    = sd?.status === "done";
        const isActive  = sd?.status === "loading" || sd?.status === "waiting";
        const Icon = ICON_MAP[step.icon] || Search;

        return (
          <div key={step.id} className="tracker-item">
            <div className={`tracker-step ${isDone ? "done" : isActive ? "active" : ""}`}>
              {isDone
                ? <Check size={13} strokeWidth={3} />
                : <Icon size={13} strokeWidth={2} />
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
  );
}
