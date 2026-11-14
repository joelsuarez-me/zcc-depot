import type { jsPDF } from "jspdf";
import { ResearchPdfLayout, PDF_COLORS as C } from "./research-pdf-layout";
import { inlineRuns, type PdfBlock } from "./research-pdf-markdown";

/** A brief-only theme: agenda and research reports keep their existing export contracts. */
export class ExecutiveBriefLayout extends ResearchPdfLayout {
  private briefSection = "";
  private briefNumber = "";
  private headingCount = 0;
  constructor(doc: jsPDF, title: string) { super(doc, title, []); }

  override newPage(continued = true) {
    super.newPage(false);
    if (continued && this.briefSection) this.drawSection(`${this.briefSection} (continued)`, this.briefNumber, true);
  }
  override section(title: string, number: string) {
    if (this.y + 100 > this.bottom) this.newPage(false);
    this.briefSection = title; this.briefNumber = number;
    this.drawSection(title, number);
  }
  private drawSection(title: string, number: string, continued = false) {
    const size = continued ? 14 : 19, leading = size * 1.25;
    const lines = this.plainLines(title, this.contentWidth - 44, size, true);
    this.doc.setFillColor(...C.lime); this.doc.roundedRect(this.margin, this.y + 1, 30, 28, 7, 7, "F");
    this.text(number, this.margin + 7, this.y + 20, 10, true);
    lines.forEach((line, i) => this.paint(line, this.margin + 42, this.y + i * leading, size, true));
    this.y += Math.max(30, lines.length * leading) + 17;
  }
  override paragraph(text: string, options: { bold?: boolean; size?: number; indent?: number; quote?: boolean; marker?: string } = {}) {
    const size = options.size ?? 12;
    if (options.marker === undefined && !options.quote) {
      super.paragraph(text, { ...options, size }); return;
    }
    const { doc, margin: M, contentWidth: W } = this;
    const isBullet = options.marker !== undefined;
    const left = M + (isBullet ? 36 : 17), width = W - (isBullet ? 50 : 32);
    const lines = this.lines(inlineRuns(text, this.sources), width, size, options.bold);
    const leading = size * 1.5, padding = 11;
    let offset = 0;
    // Measured cards split safely rather than clipping unusually long points.
    this.ensure(Math.min(lines.length * leading + padding * 2, 300));
    while (offset < lines.length) {
      let capacity = Math.floor((this.bottom - this.y - padding * 2) / leading);
      if (capacity < 1) { this.newPage(); capacity = Math.floor((this.bottom - this.y - padding * 2) / leading); }
      const take = Math.min(capacity, lines.length - offset), height = take * leading + padding * 2;
      doc.setFillColor(...(isBullet ? C.mist : [245, 246, 240] as [number, number, number]));
      doc.roundedRect(M, this.y, W, height, 7, 7, "F");
      if (isBullet) {
        doc.setFillColor(...C.forest); doc.circle(M + 18, this.y + padding + size / 2 + 1, options.marker ? 8 : 3, "F");
        if (options.marker) this.text(options.marker, M + 14, this.y + padding + size / 2 + 4, 8, true, C.lime);
      } else {
        doc.setDrawColor(...C.forest); doc.setLineWidth(2);
        doc.line(M + 3, this.y + 10, M + 3, this.y + height - 10);
      }
      lines.slice(offset, offset + take).forEach((line, i) => this.paint(line, left, this.y + padding + i * leading, size, options.bold));
      this.y += height + 8; offset += take;
      if (offset < lines.length) this.newPage();
    }
  }
  override blocks(blocks: PdfBlock[]) {
    for (const block of blocks) {
      if (block.kind === "heading") this.section(block.text, String(++this.headingCount).padStart(2, "0"));
      else if (block.kind === "table") this.table(block.headers, block.rows, block.align);
      else if (block.kind === "list") this.paragraph(block.text, { marker: block.marker, indent: block.indent });
      else this.paragraph(block.text, { quote: block.kind === "quote" });
    }
  }
  override table(headers: string[], rows: string[][], align: ("left" | "center" | "right")[] = []) {
    // Wider tables become readable records instead of shrinking text to fit.
    if (headers.length > 3) {
      rows.forEach((row, index) => {
        this.paragraph(`Record ${index + 1}`, { bold: true, size: 14 });
        this.table(["Field", "Detail"], headers.map((header, i) => [header, row[i] ?? ""]));
      });
      return;
    }
    const cols = Math.max(1, headers.length), width = this.contentWidth / cols;
    const labelColumn = /^(consideration|field|stage|factor|criterion|feature|topic)$/i.test(headers[0] ?? "");
    const size = 11, leading = 16.5, padding = 11;
    const headLines = headers.map(header => this.plainLines(header, width - padding * 2, size, true));
    const headH = Math.max(1, ...headLines.map(lines => lines.length)) * leading + padding * 2;
    // Exceptional text-heavy header cells are preserved above a short, repeated header.
    if (headH > 160) {
      headers.forEach((header, i) => this.paragraph(`Column ${i + 1}: ${header}`));
      this.table(headers.map((_, i) => `Column ${i + 1}`), rows, align); return;
    }
    const header = () => {
      this.doc.setFillColor(...C.forest); this.doc.rect(this.margin, this.y, this.contentWidth, headH, "F");
      headLines.forEach((lines, col) => lines.forEach((line, i) => this.paint(line, this.margin + col * width + padding, this.y + padding + i * leading, size, true, C.white)));
      this.y += headH;
    };
    const next = () => { this.newPage(); header(); };
    const firstHeight = Math.max(1, ...(rows[0] ?? []).map(cell => this.lines(inlineRuns(cell, this.sources), width - padding * 2, size).length)) * leading + padding * 2;
    this.ensure(headH + (firstHeight < 500 - headH ? firstHeight : 65)); header();
    rows.forEach((row, index) => {
      const cells = Array.from({ length: cols }, (_, col) => this.lines(inlineRuns(row[col] ?? "", this.sources), width - padding * 2, size));
      const count = Math.max(1, ...cells.map(lines => lines.length)), height = count * leading + padding * 2;
      if (height < 500 - headH && this.y + height > this.bottom) next();
      let offset = 0;
      while (offset < count) {
        let capacity = Math.floor((this.bottom - this.y - padding * 2) / leading);
        if (capacity < 1) { next(); capacity = Math.floor((this.bottom - this.y - padding * 2) / leading); }
        const take = Math.min(capacity, count - offset), h = take * leading + padding * 2;
        this.doc.setFillColor(...(index % 2 ? C.white : C.mist));
        this.doc.setDrawColor(...C.line); this.doc.setLineWidth(.5);
        this.doc.rect(this.margin, this.y, this.contentWidth, h, "FD");
        cells.forEach((lines, col) => {
          const x = this.margin + col * width + padding;
          lines.slice(offset, offset + take).forEach((line, n) => {
            const spare = Math.max(0, width - padding * 2 - line.reduce((sum, run) => sum + run.width, 0));
            this.paint(line, x + (align[col] === "right" ? spare : align[col] === "center" ? spare / 2 : 0), this.y + padding + n * leading, size, labelColumn && col === 0);
          });
        });
        this.y += h; offset += take;
        if (offset < count) next();
      }
    });
    this.y += 17;
  }
  references(origin: string, sources: { title: string; url: string }[], disclaimer: string) {
    const notes = [{ title: "Original section", url: origin }, ...sources.filter(source => source.url !== origin)];
    this.briefSection = "";
    const height = notes.reduce((sum, source) => sum + this.plainLines(source.title, this.contentWidth - 20, 10).length * 15 + 7, 0)
      + this.plainLines(disclaimer, this.contentWidth, 10).length * 15 + 45;
    this.ensure(Math.min(height, 350));
    this.doc.setDrawColor(...C.line); this.doc.setLineWidth(.8);
    this.doc.line(this.margin, this.y, this.width - this.margin, this.y); this.y += 12;
    this.paragraph("SOURCE NOTES", { size: 9, bold: true });
    notes.forEach((source, i) => this.paragraph(`[${i + 1}. ${source.title}](${source.url})`, { size: 10 }));
    this.paragraph(disclaimer, { size: 10 });
  }
  override footers(date: string, label = "SECTION BRIEF") {
    const total = this.doc.getNumberOfPages();
    for (let page = 1; page <= total; page++) {
      this.doc.setPage(page); this.doc.setDrawColor(...C.line); this.doc.setLineWidth(.6);
      this.doc.line(this.margin, 748, this.width - this.margin, 748);
      this.text(`ZCC DEPOT / ${label}`, this.margin, 766, 8, true, C.muted);
      this.font(8); this.doc.text(`${date}  |  ${page} / ${total}`, this.width - this.margin, 766, { align: "right" });
    }
  }
}
