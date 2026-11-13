import { jsPDF } from "jspdf";
import type { ResearchReport } from "@workspace/api-client-react";
import { splitResearchAgenda } from "./research-agenda";

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
  const M = 36;
  const CW = W - M * 2;
  const BOTTOM = H - 54;
  const PAD = 18;
  const PAPER: [number, number, number] = [241, 242, 235];
  const CARD: [number, number, number] = [251, 251, 246];
  type Row = { text: string; size: number; height: number; bold?: boolean; url?: string; muted?: boolean };
  let y = M;
  const safeLink = (url: string) => /^https?:\/\//i.test(url);
  const background = () => {
    doc.setFillColor(...PAPER);
    doc.rect(0, 0, W, H, "F");
  };
  const newPage = () => { doc.addPage(); background(); y = M; };
  const rows = (text: string, options: Partial<Row> = {}): Row[] => {
    const size = options.size ?? 10.5;
    doc.setFont("helvetica", options.bold ? "bold" : "normal");
    doc.setFontSize(size);
    return (doc.splitTextToSize(pdfText(text), CW - 2 * PAD) as string[]).map(line => ({
      text: line, size, height: size * 1.45, ...options,
    }));
  };
  const paintRow = (row: Row, x: number, top: number) => {
    doc.setFont("helvetica", row.bold ? "bold" : "normal");
    doc.setFontSize(row.size);
    doc.setTextColor(...(row.muted ? MUTED : INK));
    doc.text(row.text, x, top + row.size);
    if (row.url && safeLink(row.url)) doc.link(x, top, CW - 2 * PAD, row.height, { url: row.url });
    // Each visible inline reference links to its own authoritative source.
    for (const match of row.text.matchAll(/\[(\d+)\]/g)) {
      const source = report.sources.find(item => item.id === Number(match[1]));
      if (!source || !safeLink(source.url)) continue;
      const offset = doc.getTextWidth(row.text.slice(0, match.index));
      doc.link(x + offset, top, doc.getTextWidth(match[0]), row.height, { url: source.url });
    }
  };
  const card = (title: string, body: Row[]) => {
    if (!body.length) body = rows("No text provided.");
    const heading = pdfText(title);
    let cursor = 0;
    let continued = false;
    while (cursor < body.length) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(15);
      const headingLines = doc.splitTextToSize(`${heading}${continued ? " (continued)" : ""}`, CW - 2 * PAD) as string[];
      const headingHeight = headingLines.length * 19 + 12;
      const overhead = PAD * 2 + headingHeight;
      const remaining = body.slice(cursor).reduce((sum, row) => sum + row.height, 0);
      // Keep a short card intact; split only a card larger than a whole page.
      if (y + overhead + Math.min(remaining, 35) > BOTTOM ||
          (remaining + overhead <= BOTTOM - M && y + remaining + overhead > BOTTOM)) newPage();
      let end = cursor;
      let height = overhead;
      while (end < body.length && y + height + body[end].height <= BOTTOM) height += body[end++].height;
      if (end === cursor) throw new Error("A report section could not fit on the PDF page.");
      doc.setFillColor(...CARD); doc.setDrawColor(217, 221, 210); doc.setLineWidth(.6);
      doc.roundedRect(M, y, CW, height, 16, 16, "FD");
      doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(...FOREST);
      doc.text(headingLines, M + PAD, y + PAD + 15, { lineHeightFactor: 19 / 15 });
      let lineY = y + PAD + headingHeight;
      for (; cursor < end; cursor++) { paintRow(body[cursor], M + PAD, lineY); lineY += body[cursor].height; }
      y += height + 12;
      if (cursor < body.length) { continued = true; newPage(); }
    }
  };

  background();
  doc.setProperties({ title: `${report.companyName} | Zendesk Contact Center Demo`, author: "ZCC Depot" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(20);
  const nameLines = doc.splitTextToSize(pdfText(report.companyName), CW - 2 * PAD - (logoDataUrl ? 92 : 0)) as string[];
  const headerHeight = 84 + nameLines.length * 24;
  doc.setFillColor(...FOREST);
  doc.roundedRect(M, y, CW, headerHeight, 18, 18, "F");
  doc.setTextColor(209, 244, 112); doc.setFontSize(8);
  doc.text("CUSTOMER WORKSHOP - RESEARCH BRIEF", M + PAD, y + 24);
  doc.setTextColor(245, 245, 242); doc.setFontSize(20);
  doc.text(nameLines, M + PAD, y + 51, { lineHeightFactor: 1.2 });
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text("Zendesk Contact Center Demo", M + PAD, y + 59 + nameLines.length * 24);
  if (logoDataUrl) {
    try {
      const p = doc.getImageProperties(logoDataUrl), box = 72;
      const scale = Math.min((box - 16) / p.width, (box - 16) / p.height);
      const width = p.width * scale, height = p.height * scale;
      const x = W - M - PAD - box, top = y + PAD;
      doc.setFillColor(255, 255, 255); doc.roundedRect(x, top, box, box, 8, 8, "F");
      doc.addImage(logoDataUrl, "PNG", x + (box - width) / 2, top + (box - height) / 2, width, height);
    } catch { throw new Error("The company logo could not be added to the PDF. Refresh its lookup or export without a logo."); }
  }
  y += headerHeight + 12;
  const contextRows = [
    ...rows(`Website: ${report.companyWebsite}`, { size: 9, url: report.companyWebsite }),
    ...rows(`Region: ${report.region}`, { size: 9 }),
    ...rows(`Audience: ${report.audience}`, { size: 9 }),
    ...rows(`Researched: ${report.researchedAt.slice(0, 10)} | ${report.sources.length} cited sources`, { size: 9 }),
    ...rows("AI-generated from public sources. Verify cited claims and configured capabilities before customer use.", { size: 8.5, muted: true }),
  ];
  for (const row of contextRows) {
    if (y + row.height > BOTTOM) newPage();
    paintRow(row, M + PAD, y);
    y += row.height;
  }
  y += 14;
  for (const section of splitResearchAgenda(report.markdown)) {
    if (/^(?:\d+\.\s*)?sources$/i.test(section.title)) continue;
    const body: Row[] = [];
    if (section.title === "Company and objective") {
      body.push(...rows("Company name", { size: 8.5, bold: true, muted: true }), ...rows(report.companyName, { bold: true }));
      body.push(...rows("Objective", { size: 8.5, bold: true, muted: true }));
    }
    for (const line of section.markdown.split("\n")) {
      if (!line.trim()) { body.push({ text: "", size: 1, height: 5 }); continue; }
      if (/^```/.test(line) || /^\s*\|?\s*:?-{2,}/.test(line)) continue;
      const heading = /^#{1,6}\s+(.*)$/.exec(line);
      body.push(...rows(inline(heading ? heading[1] : line.replace(/^\s*[-*+]\s+/, "- ").replace(/^>\s?/, "")), { bold: !!heading }));
    }
    card(section.title, body);
  }
  const sourceRows: Row[] = [];
  for (const source of report.sources) {
    sourceRows.push(...rows(`[${source.id}] ${source.title}`, { bold: true, size: 10, url: source.url }));
    sourceRows.push(...rows(`${source.publisher} - accessed ${source.accessedAt}`, { size: 8.5, muted: true }));
    sourceRows.push(...rows(source.url, { size: 8.5, url: source.url }), { text: "", size: 1, height: 7 });
  }
  if (sourceRows.length) card("Sources", sourceRows);

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
