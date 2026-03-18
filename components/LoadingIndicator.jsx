"use client";

export default function LoadingIndicator({ label }) {
  return (
    <div className="loading-row">
      <div className="spinner" />
      <span className="loading-label">{label || "Analyzing with web search…"}</span>
    </div>
  );
}
