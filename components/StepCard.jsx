"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react";
import {
  Search, BarChart2, Lightbulb, Key, LayoutList, PenLine, Rocket,
} from "lucide-react";
import MarkdownContent from "./MarkdownContent";
import LoadingIndicator from "./LoadingIndicator";
import GateInput from "./GateInput";

const ICON_MAP = {
  search: Search, "bar-chart-2": BarChart2, lightbulb: Lightbulb,
  key: Key, "layout-list": LayoutList, "pen-line": PenLine, rocket: Rocket,
};

export default function StepCard({ step, data }) {
  const [collapsed, setCollapsed] = useState(false);
  const StepIcon = ICON_MAP[step.icon] || Search;

  const statusConfig = {
    loading: { label: "In Progress",    cls: "s-loading", Icon: Loader2 },
    done:    { label: "Complete",       cls: "s-done",    Icon: CheckCircle2 },
    waiting: { label: "Awaiting Input", cls: "s-waiting", Icon: Clock },
    error:   { label: "Error",          cls: "s-error",   Icon: AlertCircle },
  };

  const sc = statusConfig[data.status] || {};
  const StatusIcon = sc.Icon;

  return (
    <div className={`step-card sc-${data.status}`}>
      {/* Header */}
      <div className="sc-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="sc-icon-wrap">
          <StepIcon size={16} strokeWidth={2} />
        </div>
        <div className="sc-title-group">
          <span className="sc-num">Step {step.id}</span>
          <span className="sc-title">{step.label}</span>
        </div>
        {sc.label && (
          <span className={`sc-badge ${sc.cls}`}>
            {StatusIcon && (
              <StatusIcon
                size={12}
                strokeWidth={2.5}
                className={data.status === "loading" ? "spin" : ""}
              />
            )}
            {sc.label}
          </span>
        )}
        <button className="sc-toggle" aria-label="Toggle">
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="sc-body">
          {data.status === "loading" && (
            <LoadingIndicator label={`Running Step ${step.id} — ${step.label}…`} />
          )}
          {data.text && <MarkdownContent text={data.text} />}
          {data.error && (
            <div className="sc-error-box">
              <AlertCircle size={14} />
              {data.error}
            </div>
          )}
          {data.gate && data.status === "waiting" && (
            <GateInput {...data.gate} />
          )}
        </div>
      )}
    </div>
  );
}
