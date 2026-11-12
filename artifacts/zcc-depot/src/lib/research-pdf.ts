import { jsPDF } from "jspdf";
import type { ResearchReport } from "@workspace/api-client-react";

/** Normalise typography for jsPDF's built-in (WinAnsi) Helvetica font. */
export function pdfText(s: string): string {
  return s
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u00A0\u2007\u202F\u2009\u200A]/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u2022\u25CF\u25AA]/g, "-")
    .replace(/\u2192/g, "->")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "?");
}

/** Strip inline markdown; links become "text (url)" so full URLs are preserved. */
function inline(s: string): string {
  return pdfText(
    s
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (_m, t: string, u: string) => (/^\[?\d+\]?$/.test(t.trim()) ? `[${t.replace(/[[\]]/g, "")}]` : `${t} (${u})`))
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/(^|\W)[*_]([^*_]+)[*_](?=\W|$)/g, "$1$2")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/<[^>]+>/g, ""),
  );
}

const INK: [number, number, number] = [17, 17, 13];
const FOREST: [number, number, number] = [32, 53, 36];
const MUTED: [number, number, number] = [95, 98, 88];

export function createResearchPdf(report: ResearchReport, logoDataUrl?: string): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 54;
  const CW = W - M * 2;
  let y = M;

  const ensure = (h: number) => { if (y + h > H - M - 16) { doc.addPage(); y = M; } };
  const write = (text: string, o: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number; gap?: number; lead?: number; url?: string } = {}) => {
    const size = o.size ?? 10;
    const indent = o.indent ?? 0;
    doc.setFont("helvetica", o.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(o.color ?? INK));
    const lh = size * (o.lead ?? 1.4);
    const lines = doc.splitTextToSize(text, CW - indent) as string[];
    for (const line of lines) {
      ensure(lh); doc.text(line, M + indent, y + size);
      if (o.url) doc.link(M + indent, y, CW - indent, lh, { url: o.url });
      y += lh;
    }
    y += o.gap ?? 4;
  };

  // Header
  const date = new Date(report.researchedAt);
  const dateStr = isNaN(date.getTime()) ? report.researchedAt : date.toUTCString().replace(/ GMT$/, " UTC");
  let textX = M;
  if (logoDataUrl) {
    try {
      const p = doc.getImageProperties(logoDataUrl);
      const box = 64;
      const s = Math.min((box - 8) / p.width, (box - 8) / p.height);
      const w = p.width * s, h = p.height * s;
      doc.setDrawColor(220, 222, 214); doc.setFillColor(255, 255, 255);
      doc.roundedRect(M, y, box, box, 6, 6, "FD");
      doc.addImage(logoDataUrl, "PNG", M + (box - w) / 2, y + (box - h) / 2, w, h);
      textX = M + box + 14;
    } catch { throw new Error("The company logo could not be added to the PDF. Refresh its lookup or export without a logo."); }
  }
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...FOREST);
  doc.text("ZENDESK CONTACT CENTER - DEMO RESEARCH", textX, y + 10);
  doc.setFontSize(20); doc.setTextColor(...INK);
  const titleLines = doc.splitTextToSize(pdfText(report.companyName), W - M - textX) as string[];
  doc.text(titleLines, textX, y + 32);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...MUTED);
  const websiteLines = doc.splitTextToSize(pdfText(report.companyWebsite), W - M - textX) as string[];
  doc.text(websiteLines, textX, y + 28 + titleLines.length * 22);
  y += Math.max(logoDataUrl ? 72 : 0, 40 + titleLines.length * 22 + Math.max(0, websiteLines.length - 1) * 12);

  doc.setDrawColor(...FOREST); doc.setLineWidth(1); doc.line(M, y, W - M, y); y += 10;
  const meta: [string, string][] = [["Region", report.region], ["Audience", report.audience], ["Researched", dateStr], ["Sources", String(report.sources.length)]];
  for (const [k, v] of meta) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...FOREST);
    ensure(14); doc.text(k.toUpperCase(), M, y + 9);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(pdfText(v), CW - 80) as string[];
    lines.forEach((l, i) => { ensure(13); doc.text(l, M + 80, y + 9 + (i ? 0 : 0)); y += 13; });
  }
  y += 4;
  write("AI-generated from public sources. Verify each cited claim before customer use.", { size: 8, color: MUTED, gap: 12 });

  // Body
  let inCode = false;
  for (const raw of report.markdown.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.replace(/\s+$/, "");
    // Render the authoritative structured sources once, below the seven sections.
    if (/^##\s+8\.\s+Sources/i.test(line)) break;
    if (/^```/.test(line)) { inCode = !inCode; continue; }
    if (inCode) { write(pdfText(line), { size: 8.5, color: MUTED, gap: 0 }); continue; }
    if (!line.trim()) { y += 3; continue; }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { ensure(10); doc.setDrawColor(220, 222, 214); doc.line(M, y + 4, W - M, y + 4); y += 10; continue; }
    if (/^\s*\|?\s*:?-{2,}/.test(line) && line.includes("|")) continue;
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = h[1].length;
      y += lvl <= 2 ? 10 : 5;
      ensure(40);
      write(inline(h[2]), { size: lvl === 1 ? 16 : lvl === 2 ? 13.5 : 11.5, bold: true, color: lvl <= 2 ? FOREST : INK, gap: 4, lead: 1.25 });
      continue;
    }
    const b = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (b) {
      const depth = Math.min(3, Math.floor(b[1].length / 2));
      const marker = /\d/.test(b[2]) ? b[2] : "-";
      const indent = 12 + depth * 14;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...FOREST);
      ensure(14); doc.text(marker, M + indent - 12, y + 10);
      write(inline(b[3]), { indent: indent + (marker.length > 2 ? 6 : 0), gap: 2 });
      continue;
    }
    if (line.includes("|") && /^\s*\|/.test(line)) {
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      write(inline(cells.join("  |  ")), { size: 9, gap: 2 });
      continue;
    }
    const q = /^>\s?(.*)$/.exec(line);
    if (q) { write(inline(q[1]), { indent: 12, color: MUTED, gap: 3 }); continue; }
    write(inline(line), { gap: 5 });
  }

  // Source list (structured)
  if (report.sources.length) {
    y += 12; ensure(60);
    write("8. Sources", { size: 13.5, bold: true, color: FOREST, gap: 6 });
    for (const s of report.sources) {
      ensure(40);
      write(`[${s.id}] ${pdfText(s.title)}`, { bold: true, size: 9.5, gap: 1 });
      write(pdfText(`${s.publisher} - accessed ${s.accessedAt}`), { size: 8.5, color: MUTED, indent: 14, gap: 1 });
      write(s.url, { size: 8.5, color: FOREST, indent: 14, gap: 6, url: s.url });
    }
  }

  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...MUTED);
    const footerName = report.companyName.length > 46 ? `${report.companyName.slice(0, 43)}...` : report.companyName;
    doc.text(pdfText(`${footerName} - ${report.researchedAt.slice(0, 10)}`), M, H - 28);
    doc.text(`Page ${i} of ${n}`, W - M, H - 28, { align: "right" });
  }
  return doc;
}

export function researchPdfFilename(report: ResearchReport): string {
  const slug = report.companyName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "company";
  return `${slug}-zcc-demo-research-${report.researchedAt.slice(0, 10)}.pdf`;
}
