import type { jsPDF } from "jspdf";
import { inlineRuns, pdfText, type PdfBlock, type PdfRun } from "./research-pdf-markdown";

type Color = [number, number, number];
type Line = (PdfRun & { width: number })[];
export const PDF_COLORS = {
  ink: [25, 39, 32] as Color, forest: [28, 54, 42] as Color,
  lime: [209, 244, 112] as Color, muted: [86, 104, 94] as Color,
  paper: [255, 255, 252] as Color, mist: [239, 245, 239] as Color,
  line: [212, 223, 213] as Color, white: [255, 255, 255] as Color,
};

/** Measured, selectable PDF text with shared page geometry for every report block. */
export class ResearchPdfLayout {
  readonly width = 612;
  readonly height = 792;
  readonly margin = 44;
  readonly contentWidth = 524;
  readonly bottom = 730;
  y = 40;
  private activeSection = "";
  private activeNumber = "";
  constructor(readonly doc: jsPDF, readonly company: string, readonly sources: { id: number; url: string }[]) {
    this.background();
  }
  private background() {
    this.doc.setFillColor(...PDF_COLORS.paper);
    this.doc.rect(0, 0, this.width, this.height, "F");
  }
  font(size: number, bold = false) {
    this.doc.setFont("helvetica", bold ? "bold" : "normal");
    this.doc.setFontSize(size);
  }
  text(text: string, x: number, y: number, size = 10, bold = false, color = PDF_COLORS.ink) {
    this.font(size, bold); this.doc.setTextColor(...color); this.doc.text(pdfText(text), x, y);
  }
  lines(runs: PdfRun[], width: number, size = 10, bold = false): Line[] {
    const result: Line[] = [];
    let line: Line = [], used = 0;
    const flush = () => { if (line.length) result.push(line); line = []; used = 0; };
    for (const run of runs) {
      for (let word of run.text.split(/(\s+)/).filter(Boolean)) {
        this.font(size, bold || !!run.bold);
        if (!used && /^\s+$/.test(word)) continue;
        let measured = this.doc.getTextWidth(word);
        if (used + measured > width && used) {
          flush();
          if (/^\s+$/.test(word)) continue;
        }
        // Split long unbroken URLs/tokens, without clipping or dropping characters.
        while (measured > width) {
          let low = 1, high = word.length;
          while (low < high) {
            const mid = Math.ceil((low + high) / 2);
            if (this.doc.getTextWidth(word.slice(0, mid)) <= width) low = mid;
            else high = mid - 1;
          }
          const part = word.slice(0, low), w = this.doc.getTextWidth(part);
          line.push({ ...run, text: part, width: w }); flush();
          word = word.slice(low); measured = this.doc.getTextWidth(word);
        }
        if (word) { line.push({ ...run, text: word, width: measured }); used += measured; }
      }
    }
    flush();
    return result.length ? result : [[]];
  }
  plainLines(text: string, width: number, size = 10, bold = false) {
    return this.lines([{ text: pdfText(text) }], width, size, bold);
  }
  paint(line: Line, x: number, top: number, size = 10, bold = false, color = PDF_COLORS.ink) {
    const merged: Line = [];
    for (const run of line) {
      const previous = merged[merged.length - 1];
      if (previous && !!previous.bold === !!run.bold && previous.url === run.url) {
        previous.text += run.text; previous.width += run.width;
      } else merged.push({ ...run });
    }
    for (const run of merged) {
      this.font(size, bold || !!run.bold);
      this.doc.setTextColor(...(run.url && color !== PDF_COLORS.white ? PDF_COLORS.forest : color));
      this.doc.text(run.text, x, top + size);
      if (run.url && /^https?:\/\//i.test(run.url)) {
        this.doc.link(x, top, Math.max(run.width, 1), size * 1.4, { url: run.url });
      }
      x += run.width;
    }
  }
  newPage(continued = true) {
    this.doc.addPage(); this.background();
    this.text("PLATFORM ARCHITECT DEPOT", this.margin, 29, 7, true, PDF_COLORS.muted);
    const name = pdfText(this.company);
    this.font(7);
    const shortened = this.doc.getTextWidth(name) < 220 ? name : `${name.slice(0, 44)}...`;
    this.doc.setTextColor(...PDF_COLORS.muted);
    this.doc.text(shortened, this.width - this.margin, 29, { align: "right" });
    this.doc.setDrawColor(...PDF_COLORS.line);
    this.doc.setLineWidth(.6);
    this.doc.line(this.margin, 40, this.width - this.margin, 40);
    this.y = 58;
    if (continued && this.activeSection) this.sectionHeading(`${this.activeSection} (continued)`, this.activeNumber, true);
  }
  ensure(height: number) { if (this.y + height > this.bottom) this.newPage(); }
  section(title: string, number: string) {
    if (this.y + 78 > this.bottom) this.newPage(false);
    this.activeSection = title; this.activeNumber = number;
    this.sectionHeading(title, number);
  }
  private sectionHeading(title: string, number: string, continued = false) {
    const lines = this.plainLines(title, this.contentWidth - 48, continued ? 13 : 17, true);
    this.doc.setFillColor(...PDF_COLORS.forest);
    this.doc.roundedRect(this.margin, this.y, 30, 27, 7, 7, "F");
    this.text(number, this.margin + 7, this.y + 18, 10, true, PDF_COLORS.lime);
    lines.forEach((line, i) => this.paint(line, this.margin + 42, this.y + i * 21 + 3, continued ? 13 : 17, true));
    this.y += Math.max(29, lines.length * 21 + 6);
    this.doc.setDrawColor(...PDF_COLORS.line);
    this.doc.line(this.margin, this.y + 5, this.width - this.margin, this.y + 5);
    this.y += 19;
  }
  paragraph(text: string, options: { bold?: boolean; size?: number; indent?: number; quote?: boolean; marker?: string } = {}) {
    const { bold = false, size = 10, indent = 0, quote = false, marker } = options;
    const left = this.margin + indent + (marker !== undefined ? 25 : quote ? 16 : 0);
    const width = this.width - this.margin - left;
    const lines = this.lines(inlineRuns(text, this.sources), width, size, bold);
    const leading = size * 1.48;
    this.ensure(Math.min(lines.length, 2) * leading + 4);
    if (marker !== undefined) {
      this.doc.setFillColor(...(marker ? PDF_COLORS.mist : PDF_COLORS.forest));
      this.doc.circle(this.margin + indent + 8, this.y + 7, marker ? 9 : 3, "F");
      if (marker) this.text(marker, this.margin + indent + (marker.length > 1 ? 2 : 5), this.y + 10, 8, true);
    }
    for (const line of lines) {
      this.ensure(leading);
      if (quote) {
        this.doc.setDrawColor(...PDF_COLORS.forest); this.doc.setLineWidth(2);
        this.doc.line(this.margin + 3, this.y, this.margin + 3, this.y + leading);
      }
      this.paint(line, left, this.y, size, bold, quote ? PDF_COLORS.muted : PDF_COLORS.ink);
      this.y += leading;
    }
    this.y += 7;
  }
  blocks(blocks: PdfBlock[]) {
    for (const block of blocks) {
      if (block.kind === "table") this.table(block.headers, block.rows, block.align);
      else if (block.kind === "heading") {
        const height = this.plainLines(block.text, this.contentWidth, 11.5, true).length * 17;
        this.ensure(height + 36);
        this.paragraph(block.text, { bold: true, size: 11.5 });
      } else if (block.kind === "list") this.paragraph(block.text, { marker: block.marker, indent: block.indent });
      else this.paragraph(block.text, { quote: block.kind === "quote" });
    }
  }
  table(headers: string[], rows: string[][], align: ("left" | "center" | "right")[] = []) {
    if (headers.length > 6) {
      // Wide tables become record-oriented two-column tables, preserving every field.
      rows.forEach((row, i) => {
        this.ensure(80); this.paragraph(`Record ${i + 1}`, { bold: true });
        this.table(["Field", "Research detail"], headers.map((header, n) => [header, row[n] ?? ""]));
      });
      return;
    }
    const columns = Math.max(1, headers.length), cellWidth = this.contentWidth / columns;
    const size = columns > 4 ? 8 : 9, leading = 13, padding = 9;
    const cellX = (line: Line, col: number) => {
      const unused = Math.max(0, cellWidth - padding * 2 - line.reduce((sum, run) => sum + run.width, 0));
      return this.margin + col * cellWidth + padding + (align[col] === "right" ? unused : align[col] === "center" ? unused / 2 : 0);
    };
    let headLines = headers.map(header => this.lines(inlineRuns(header, this.sources), cellWidth - padding * 2, size, true));
    let headHeight = Math.max(...headLines.map(lines => lines.length)) * leading + padding * 2;
    if (headHeight > 220) {
      headers.forEach((header, i) => this.paragraph(`Column ${i + 1}: ${header}`, { size: 9 }));
      headLines = headers.map((_, i) => this.plainLines(`Column ${i + 1}`, cellWidth - padding * 2, size, true));
      headHeight = leading + padding * 2;
    }
    const paintHeader = () => {
      this.doc.setFillColor(...PDF_COLORS.forest);
      this.doc.rect(this.margin, this.y, this.contentWidth, headHeight, "F");
      headLines.forEach((lines, col) => lines.forEach((line, i) =>
        this.paint(line, cellX(line, col), this.y + padding + i * leading, size, true, PDF_COLORS.white)));
      this.y += headHeight;
    };
    const page = () => { this.newPage(); this.text("TABLE CONTINUED", this.margin, this.y + 7, 7, true, PDF_COLORS.muted); this.y += 17; paintHeader(); };
    this.ensure(headHeight + 44); paintHeader();
    rows.forEach((row, index) => {
      const cells = Array.from({ length: columns }, (_, col) => this.lines(inlineRuns(row[col] ?? "", this.sources), cellWidth - padding * 2, size));
      const count = Math.max(...cells.map(lines => lines.length));
      const fullHeight = count * leading + padding * 2;
      // Keep ordinary rows whole. Only exceptionally tall rows split across pages.
      if (fullHeight < 500 - headHeight && this.y + fullHeight > this.bottom) page();
      let offset = 0;
      while (offset < count) {
        let capacity = Math.floor((this.bottom - this.y - padding * 2) / leading);
        if (capacity < 1) { page(); capacity = Math.floor((this.bottom - this.y - padding * 2) / leading); }
        const take = Math.min(capacity, count - offset), height = take * leading + padding * 2;
        this.doc.setFillColor(...(index % 2 ? PDF_COLORS.paper : PDF_COLORS.mist));
        this.doc.setDrawColor(...PDF_COLORS.line); this.doc.setLineWidth(.5);
        this.doc.rect(this.margin, this.y, this.contentWidth, height, "FD");
        cells.forEach((lines, col) => {
          if (col) this.doc.line(this.margin + col * cellWidth, this.y, this.margin + col * cellWidth, this.y + height);
          lines.slice(offset, offset + take).forEach((line, n) =>
            this.paint(line, cellX(line, col), this.y + padding + n * leading, size));
        });
        this.y += height; offset += take;
        if (offset < count) page();
      }
    });
    this.y += 15;
  }
  footers(date: string, label = "DEMO RESEARCH") {
    const total = this.doc.getNumberOfPages();
    for (let page = 1; page <= total; page++) {
      this.doc.setPage(page); this.doc.setDrawColor(...PDF_COLORS.line); this.doc.setLineWidth(.6);
      this.doc.line(this.margin, 748, this.width - this.margin, 748);
      this.text(`ZCC DEPOT  /  ${label}`, this.margin, 764, 7, true, PDF_COLORS.muted);
      this.text(date, 295, 764, 7, false, PDF_COLORS.muted);
      this.doc.setFontSize(7); this.doc.text(`Page ${page} of ${total}`, this.width - this.margin, 764, { align: "right" });
    }
  }
}
