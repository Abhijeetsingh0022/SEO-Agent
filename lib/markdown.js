/**
 * Lightweight markdown-to-HTML renderer.
 * Handles: headings, bold, italic, code, tables, lists, blockquotes, HR, paragraphs.
 * Includes XSS protection via HTML entity escaping.
 */

// HTML entity encode to prevent XSS
function escapeHtml(str) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return str.replace(/[&<>"']/g, (char) => map[char]);
}

export function renderMarkdown(text) {
  if (!text) return "";

  const lines = text.split("\n");
  const html = [];
  let inTable = false;
  let tableHeader = true;
  let inUl = false;
  let inOl = false;
  let inPre = false;
  let preBuffer = [];

  const flushList = () => {
    if (inUl) { html.push("</ul>"); inUl = false; }
    if (inOl) { html.push("</ol>"); inOl = false; }
  };
  const flushTable = () => {
    if (inTable) { html.push("</tbody></table>"); inTable = false; tableHeader = true; }
  };

  // Process inline markdown with XSS protection
  const inline = (str) => {
    // Step 1: Extract inline code spans BEFORE escaping to protect their content
    const codeSpans = [];
    const withPlaceholders = str.replace(/`([^`]+)`/g, (_, code) => {
      codeSpans.push(code);
      return `\x00CODE${codeSpans.length - 1}\x00`;
    });

    // Step 2: Escape HTML to prevent XSS
    let escaped = escapeHtml(withPlaceholders);

    // Step 3: Restore code spans as safe <code> elements
    escaped = escaped.replace(/\x00CODE(\d+)\x00/g, (_, i) =>
      `<code>${escapeHtml(codeSpans[parseInt(i)])}</code>`
    );

    // Step 4: Apply remaining markdown formatting
    escaped = escaped
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    return escaped;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw;

    // Code block fence
    if (line.startsWith("```")) {
      if (!inPre) {
        flushList(); flushTable();
        inPre = true;
        preBuffer = [];
        continue;
      } else {
        html.push(`<pre><code>${preBuffer.join("\n").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`);
        inPre = false;
        preBuffer = [];
        continue;
      }
    }
    if (inPre) { preBuffer.push(line); continue; }

    // Blank line
    if (line.trim() === "") {
      flushList(); flushTable();
      continue;
    }

    // Headings
    const h4 = line.match(/^####\s+(.+)$/);
    const h3 = line.match(/^###\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    const h1 = line.match(/^#\s+(.+)$/);
    if (h4) { flushList(); flushTable(); html.push(`<h4>${inline(h4[1])}</h4>`); continue; }
    if (h3) { flushList(); flushTable(); html.push(`<h3>${inline(h3[1])}</h3>`); continue; }
    if (h2) { flushList(); flushTable(); html.push(`<h2>${inline(h2[1])}</h2>`); continue; }
    if (h1) { flushList(); flushTable(); html.push(`<h1>${inline(h1[1])}</h1>`); continue; }

    // HR
    if (/^---+$/.test(line.trim())) { flushList(); flushTable(); html.push("<hr />"); continue; }

    // Blockquote
    const bq = line.match(/^>\s*(.+)$/);
    if (bq) { flushList(); flushTable(); html.push(`<blockquote>${inline(bq[1])}</blockquote>`); continue; }

    // Table
    if (line.includes("|")) {
      const cells = line.split("|").map((c) => c.trim()).filter((_, i2, a) => i2 > 0 && i2 < a.length - 1);
      // Separator row (--- )
      if (cells.every((c) => /^[-:]+$/.test(c))) {
        tableHeader = false;
        continue;
      }
      flushList();
      if (!inTable) {
        html.push('<table><thead>');
        inTable = true;
        tableHeader = true;
      }
      if (tableHeader) {
        html.push(`<tr>${cells.map((c) => `<th>${inline(c)}</th>`).join("")}</tr>`);
        html.push("</thead><tbody>");
        tableHeader = false;
      } else {
        html.push(`<tr>${cells.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`);
      }
      continue;
    }

    // Unordered list
    const ul = line.match(/^[\*\-]\s+(.+)$/);
    if (ul) {
      flushTable();
      if (!inUl) { if (inOl) { html.push("</ol>"); inOl = false; } html.push("<ul>"); inUl = true; }
      html.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }

    // Ordered list
    const ol = line.match(/^\d+\.\s+(.+)$/);
    if (ol) {
      flushTable();
      if (!inOl) { if (inUl) { html.push("</ul>"); inUl = false; } html.push("<ol>"); inOl = true; }
      html.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }

    // Plain paragraph
    flushList(); flushTable();
    html.push(`<p>${inline(line)}</p>`);
  }

  flushList();
  flushTable();

  return html.join("\n");
}
