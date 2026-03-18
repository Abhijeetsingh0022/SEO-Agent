"use client";
import { renderMarkdown } from "@/lib/markdown";

export default function MarkdownContent({ text }) {
  if (!text) return null;
  return (
    <div
      className="md-body"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
    />
  );
}
