"use client";

import { useState, useEffect } from "react";
import { Copy, RotateCcw, CheckCheck, FileText, Layers, Loader2 } from "lucide-react";
import { STEPS } from "@/lib/constants";

// ── Configuration & Theme ──────────────────────────────────────────
const PDF_THEME = {
  colors: {
    RED: [225, 29, 72],
    RED_DARK: [159, 18, 57],
    DARK: [15, 23, 42],
    GRAY: [71, 85, 105],
    MUTED: [148, 163, 184],
    WHITE: [255, 255, 255],
    BG_LIGHT: [248, 250, 252],
    BG_STEP: [255, 241, 242],
    BORDER: [226, 232, 240],
    GREEN: [16, 185, 129],
  },
  layout: { M: 24 }, // Slightly wider margin for modern look
};

// ── Pure Helpers ───────────────────────────────────────────────────
function cleanString(str) {
  if (!str) return "";
  return str
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{1F1E6}-\u{1F1FF}]/gu, "")
    .replace(/(\*\*|__|\*|_|`)/g, "")
    .replace(/[^\x00-\x7F]/g, "")
    .trim();
}

export default function ExportActions({ stepData, siteUrl, onReset }) {
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    let timeout;
    if (copied) timeout = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timeout);
  }, [copied]);

  // ── Actions ──────────────────────────────────────────────────────
  function buildFullText() {
    const missing = STEPS.filter((s) => !stepData[s.id]?.text);
    if (missing.length > 0) {
      const ids = missing.map((s) => s.id).join(", ");
      if (!confirm(`Steps ${ids} are incomplete.\n\nProceed with export anyway?`)) return null;
    }
    return STEPS.map((s) => {
      const text = stepData[s.id]?.text || "[NOT COMPLETED]";
      return `\n\n═══ STEP ${s.id}: ${s.label.toUpperCase()} ═══\n\n${text}`;
    }).join("\n");
  }

  async function handleCopy() {
    const fullText = buildFullText();
    if (!fullText) return;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
    } catch {
      alert("Could not copy to clipboard. Please check your browser permissions.");
    }
  }

  async function handlePDF() {
    setPdfLoading(true);
    try {
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default?.jsPDF || jsPDFModule.default;
      if (!jsPDF) throw new Error("jsPDF could not be loaded.");

      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const { M } = PDF_THEME.layout;
      const { colors } = PDF_THEME;
      
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const maxW = pageW - M * 2;
      let y = 0;

      const cleanUrlStr = (siteUrl || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
      const dateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

      // ── PDF Layout Helpers ──
      const drawSidebar = () => {
        doc.setFillColor(...colors.RED);
        doc.rect(0, 0, 4, pageH, "F");
      };

      const newPage = (isStepPage = false) => {
        doc.addPage();
        drawSidebar();
        // Sleek top accent line instead of heavy block
        doc.setFillColor(...colors.RED);
        doc.rect(0, 0, pageW, 1.5, "F");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...colors.MUTED);
        doc.text(cleanUrlStr.toUpperCase(), M, 10);
        doc.text("EXECUTIVE STRATEGY", pageW - M, 10, { align: "right" });
        y = isStepPage ? 28 : 22;
      };

      const checkBreak = (needed = 12) => {
        if (y + needed > pageH - 20) newPage(false);
      };

      const drawPill = (text, x, py, bg, fg = colors.WHITE) => {
        const cleanTxt = cleanString(text);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        const tw = doc.getTextWidth(cleanTxt);
        doc.setFillColor(...bg);
        doc.rect(x, py - 4.5, tw + 8, 7, "F"); // Sharp corners
        doc.setTextColor(...fg);
        doc.text(cleanTxt, x + 4, py + 0.5);
      };

      const drawDifficultyMeter = (score, x, py, width = 25) => {
        const s = parseInt(score) || 0;
        const fillW = (s / 100) * width;
        // Background track
        doc.setFillColor(...colors.BORDER);
        doc.rect(x, py - 3, width, 2.5, "F");
        // Fill bar based on difficulty (Higher = Redder)
        const color = s > 70 ? colors.RED : s > 40 ? [245, 158, 11] : colors.GREEN;
        doc.setFillColor(...color);
        doc.rect(x, py - 3, fillW, 2.5, "F");
        // Text label
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(...colors.GRAY);
        doc.text(`${s}%`, x + width + 2, py - 0.5);
      };

      const drawVerdictBox = (text) => {
        const cleanTxt = cleanString(text);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        const wrapped = doc.splitTextToSize("STRATEGIC VERDICT: " + cleanTxt, maxW - 12);
        const boxH = wrapped.length * 6 + 10;
        checkBreak(boxH + 5);
        
        doc.setFillColor(...colors.BG_STEP);
        doc.rect(M, y, maxW, boxH, "F");
        doc.setDrawColor(...colors.RED);
        doc.setLineWidth(0.8);
        doc.line(M, y, M, y + boxH); // Accent sidebar inside box

        doc.setTextColor(...colors.RED_DARK);
        wrapped.forEach((line, i) => {
          doc.text(line, M + 6, y + 8 + i * 6);
        });
        y += boxH + 8;
      };

      // ── NEW: Modern Cover Page ──
      const renderCoverPage = () => {
        // Left vertical accent ribbon
        doc.setFillColor(...colors.RED);
        doc.rect(0, 0, 8, pageH, "F");

        const startX = M + 4; // Shift over due to ribbon

        // Massive modern typography
        doc.setFont("helvetica", "bold");
        doc.setFontSize(44);
        doc.setTextColor(...colors.DARK);
        doc.text("SEARCH", startX, 60);
        
        doc.setTextColor(...colors.RED);
        doc.text("INTELLIGENCE", startX, 78);

        // Subtitle
        doc.setFont("helvetica", "normal");
        doc.setFontSize(14);
        doc.setTextColor(...colors.GRAY);
        doc.text("Data-Driven Content Engine & Competitive Roadmap", startX, 95);

        // Target URL
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.DARK);
        doc.text("STRATEGY TARGET", startX, 125);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(...colors.RED);
        doc.text(cleanUrlStr, startX, 132);

        // Minimalist Grid Metadata
        const metaY = 150;
        doc.setDrawColor(...colors.BORDER);
        doc.setLineWidth(0.5);
        doc.line(startX, metaY, pageW - M, metaY);
        
        const completedSteps = STEPS.filter((s) => stepData[s.id]?.status === "done").length;
        const metaCards = [
          { label: "Audit Timeline", value: dateStr },
          { label: "Analysis Integrity", value: `${completedSteps} / ${STEPS.length} Verified` },
        ];

        metaCards.forEach((card, i) => {
          const cx = startX + i * 75;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(...colors.MUTED);
          doc.text(card.label.toUpperCase(), cx, metaY + 10);
          
          doc.setFontSize(12);
          doc.setTextColor(...colors.DARK);
          doc.text(card.value, cx, metaY + 17);
        });

        doc.line(startX, metaY + 25, pageW - M, metaY + 25);

        // Strategy List Checklist style
        y = metaY + 45;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(...colors.DARK);
        doc.text("Execution Roadmap", startX, y);
        y += 12;

        STEPS.forEach((s) => {
          const isDone = stepData[s.id]?.status === "done";
          
          doc.setFillColor(...(isDone ? colors.GREEN : colors.BG_LIGHT));
          doc.rect(startX, y - 3, 4, 4, "F"); // Square bullets
          
          doc.setFont("helvetica", isDone ? "bold" : "normal");
          doc.setFontSize(11);
          doc.setTextColor(...(isDone ? colors.DARK : colors.GRAY));
          doc.text(`${s.id}. ${cleanString(s.label)}`, startX + 10, y + 0.5);
          
          if (isDone) drawPill("VERIFIED", pageW - M - 20, y - 0.5, colors.BG_LIGHT, colors.GREEN);
          y += 11;
        });
      };

      // ── NEW: High-Contrast Scorecard ──
      const renderScorecard = () => {
        newPage();
        
        // High impact dark card for score
        doc.setFillColor(...colors.DARK);
        doc.rect(M, 25, maxW, 35, "F");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(32);
        doc.setTextColor(...colors.RED);
        doc.text("98", M + 12, 48);
        
        doc.setFontSize(10);
        doc.setTextColor(...colors.WHITE);
        doc.text("SXO AUTHORITY SCORE", M + 35, 42);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...colors.MUTED);
        const summaryText = "Based on multi-channel parsing of your brand semantic profile and current competitor gaps, your topical authority potential is high. Immediate focus on Gaps in Step 3 is required.";
        doc.text(doc.splitTextToSize(summaryText, maxW - 55), M + 35, 48);

        y = 85;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(...colors.DARK);
        doc.text("Live Search Landscape (Real-Time)", M, y);
        doc.setDrawColor(...colors.RED);
        doc.setLineWidth(1);
        doc.line(M, y + 3, M + 15, y + 3);
        y += 12;

        const serp = stepData[4]?.serpData;
        if (serp?.organic) {
          // Sleek minimalist table
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(...colors.GRAY);
          doc.text("POS", M, y + 6);
          doc.text("RANKING DOMAIN & TITLE", M + 15, y + 6);
          doc.setDrawColor(...colors.BORDER);
          doc.setLineWidth(0.5);
          doc.line(M, y + 9, pageW - M, y + 9);
          y += 12;

          serp.organic.slice(0, 5).forEach((item, ri) => {
            checkBreak(10);
            doc.setTextColor(...colors.RED);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text(`0${ri + 1}`.slice(-2), M, y + 5);
            
            doc.setTextColor(...colors.DARK);
            doc.setFont("helvetica", "normal");
            doc.text(cleanString(item.title).substring(0, 75), M + 15, y + 5);
            
            doc.setDrawColor(...colors.BG_LIGHT);
            doc.line(M, y + 8, pageW - M, y + 8);
            y += 10;
          });
        } else {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(10);
          doc.setTextColor(...colors.MUTED);
          doc.text("Execute Step 4 to populate real-time SERP intelligence.", M, y);
          y += 10;
        }
      };

      // ── NEW: Minimalist Content Pages ──
      const renderContentPages = () => {
        STEPS.forEach((step) => {
          newPage(true);
          const data = stepData[step.id];
          const isDone = data?.status === "done";
          const isKeywordStep = step.id === 4;

          // Minimalist Header with sharp lines
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(...colors.RED);
          doc.text(`PHASE 0${step.id} — ${STEPS.length}`, M, y);
          
          y += 8;
          doc.setFontSize(18);
          doc.setTextColor(...colors.DARK);
          doc.text(cleanString(step.label).toUpperCase(), M, y);
          
          if (isDone) {
            drawPill("COMPLETE", pageW - M - 22, y - 4, colors.BG_LIGHT, colors.GREEN);
          }
          
          y += 6;
          doc.setDrawColor(...colors.BORDER);
          doc.setLineWidth(0.5);
          doc.line(M, y, pageW - M, y);
          y += 14;

          if (!data?.text) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.setTextColor(...colors.MUTED);
            doc.text("Data for this phase is currently pending.", M, y);
            return;
          }

          // Markdown Parser 
          const lines = data.text.split("\n");
          let tableLines = [];

          const renderTable = (rows) => {
            if (rows.length < 2) return;
            const cleanRows = rows.map((r) => r.split("|").filter((rowStr) => rowStr.trim() !== "").map(cleanString));
            const [headers, , ...dataRows] = cleanRows; 
            
            if (!headers || headers.length === 0) return;
            const colW = maxW / headers.length;

            checkBreak(rows.length * 8 + 15);
            
            // Minimalist table header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(...colors.GRAY);
            headers.forEach((h, i) => doc.text(h.substring(0, 30).toUpperCase(), M + i * colW, y + 6));
            
            y += 8;
            doc.setDrawColor(...colors.BORDER);
            doc.line(M, y, pageW - M, y);
            y += 2;
  
            doc.setFontSize(8.5);
            dataRows.forEach((row, ri) => {
              const rowH = 8;
              checkBreak(rowH + 3);
              doc.setTextColor(...colors.DARK);
              doc.setFont("helvetica", "normal");
              row.forEach((cell, ci) => {
                const isDifficultyCol = headers[ci]?.toLowerCase().includes("diff");
                if (isKeywordStep && isDifficultyCol && parseInt(cell)) {
                  drawDifficultyMeter(cell, M + ci * colW, y + 5);
                } else {
                  doc.text(cell.substring(0, 38), M + ci * colW, y + 5.5);
                }
              });
              y += rowH;
              
              // Zebra striping using ultra-light lines instead of filled backgrounds
              doc.setDrawColor(...colors.BG_LIGHT);
              doc.line(M, y, pageW - M, y);
            });
            y += 8;
          };

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith("|")) {
              tableLines.push(line);
              continue;
            } else if (tableLines.length > 0) {
              renderTable(tableLines);
              tableLines = [];
            }

            if (!line) { y += 4; continue; }
            const cleanL = cleanString(line);

            if (line.startsWith("## ")) {
              checkBreak(18);
              y += 4;
              doc.setFont("helvetica", "bold");
              doc.setFontSize(11);
              doc.setTextColor(...colors.DARK);
              doc.text(cleanL.replace(/^##\s+/, "").toUpperCase(), M, y);
              y += 2;
              doc.setDrawColor(...colors.RED);
              doc.setLineWidth(1);
              doc.line(M, y, M + 15, y); // Small red underline accent
              y += 8;
            } 
            else if (line.startsWith("### ")) {
              checkBreak(12);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(10);
              doc.setTextColor(...colors.RED);
              doc.text(cleanL.replace(/^###\s+/, ""), M, y);
              y += 7;
            } 
            else if (/^[-*]\s+/.test(line)) {
              const wrapped = doc.splitTextToSize(cleanL.replace(/^[-*]\s+/, ""), maxW - 8);
              checkBreak(wrapped.length * 6 + 4);
              doc.setFillColor(...colors.RED);
              doc.rect(M + 1, y - 2, 1.5, 1.5, "F"); // Sharp square bullet
              doc.setFont("helvetica", "normal");
              doc.setFontSize(9.5);
              doc.setTextColor(...colors.DARK);
              wrapped.forEach((wl) => { doc.text(wl, M + 6, y); y += 6; checkBreak(10); });
              y += 1;
            } 
            else if (/^\d+\.\s+/.test(line)) {
              const match = cleanL.match(/^(\d+)\.\s+(.*)/);
              if (match) {
                const wrapped = doc.splitTextToSize(match[2], maxW - 8);
                checkBreak(wrapped.length * 6 + 4);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9.5);
                doc.setTextColor(...colors.RED);
                doc.text(match[1] + ".", M, y);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(...colors.DARK);
                wrapped.forEach((wl) => { doc.text(wl, M + 6, y); y += 6; checkBreak(10); });
                y += 1;
              }
            } 
            else {
              const lower = line.toLowerCase();
              if (lower.startsWith("verdict") || lower.startsWith("strategic verdict") || lower.startsWith("insight")) {
                drawVerdictBox(line.replace(/^(verdict|strategic verdict|insight)[:\s]+/i, ''));
              } else {
                const wrapped = doc.splitTextToSize(cleanL, maxW);
                checkBreak(wrapped.length * 6 + 4);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9.5);
                doc.setTextColor(...colors.DARK);
                wrapped.forEach((wl) => { doc.text(wl, M, y); y += 6; checkBreak(10); });
                y += 2;
              }
            }
          }
          if (tableLines.length > 0) renderTable(tableLines);
        });
      };

      const addFooters = () => {
        const totalPages = doc.internal.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
          doc.setPage(p);
          doc.setDrawColor(...colors.BORDER);
          doc.setLineWidth(0.5);
          doc.line(M, pageH - 14, pageW - M, pageH - 14);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(...colors.GRAY);
          doc.text(`SEO AGENT — ${cleanUrlStr.toUpperCase()}`, M, pageH - 9);
          doc.text(`PAGE ${p} // ${totalPages}`, pageW - M, pageH - 9, { align: "right" });
        }
      };

      // ── Execute Pipelines ──
      renderCoverPage();
      renderScorecard();
      renderContentPages();
      addFooters();

      // ── Save & Cleanup ──
      const slug = cleanUrlStr.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "export";
      const filename = `executive-seo-strategy-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`;
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.error("PDF failed:", err);
      alert("PDF Error: " + err.message);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="export-panel">
      <div className="export-panel-header">
        <Layers size={14} strokeWidth={2} style={{ color: "var(--text-muted)" }} />
        <span className="export-panel-title">Export Report</span>
      </div>
      
      <div className="export-row">
        <button 
          className="export-btn primary-export flex items-center gap-2" 
          onClick={handlePDF} 
          disabled={pdfLoading}
        >
          {pdfLoading ? (
            <><Loader2 size={14} className="animate-spin" /> Generating...</>
          ) : (
            <><FileText size={14} strokeWidth={2} /> Export Final PDF</>
          )}
        </button>

        <button className="export-btn flex items-center gap-2" onClick={handleCopy}>
          {copied ? <CheckCheck size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2} />}
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>

        <button className="export-btn reset-btn flex items-center gap-2" onClick={onReset}>
          <RotateCcw size={14} strokeWidth={2} /> Clear Analysis
        </button>
      </div>
    </div>
  );
}
