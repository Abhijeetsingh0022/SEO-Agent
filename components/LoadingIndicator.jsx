"use client";

export default function LoadingIndicator({ label }) {
  return (
    <div className="loading-row">
      <div className="loading-dots" aria-hidden="true">
        <span className="loading-dot" />
        <span className="loading-dot" />
        <span className="loading-dot" />
      </div>
      <span className="loading-label">
        {label || "Analyzing with live web search…"}
      </span>
    </div>
  );
}
