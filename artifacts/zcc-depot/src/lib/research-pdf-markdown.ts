export type PdfBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph" | "quote"; text: string }
  | { kind: "list"; text: string; marker: string; indent: number }
  | { kind: "table"; headers: string[]; rows: string[][]; align: ("left" | "center" | "right")[] };

/** Parse table cells without treating escaped pipes or code-span pipes as separators. */
export function tableCells(line: string): string[] {
  const cells: string[] = [];
  let cell = "", code = false;
  const text = line.trim().replace(/^\|/, "").replace(/(?<!\\)\|$/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "\\" && text[i + 1] === "|") { cell += "|"; i++; }
    else if (c === "`") { code = !code; cell += c; }
    else if (c === "|" && !code) { cells.push(cell.trim()); cell = ""; }
    else cell += c;
  }
  cells.push(cell.trim());
  return cells;
}

export function parsePdfBlocks(markdown: string): PdfBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: PdfBlock[] = [];
  let paragraph: string[] = [], fenced = false;
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i], trimmed = line.trim();
    if (/^```/.test(trimmed)) { flush(); fenced = !fenced; continue; }
    if (!trimmed) { flush(); continue; }
    if (!fenced && i + 1 < lines.length && line.includes("|") &&
      tableCells(lines[i + 1]).every(cell => /^:?-{3,}:?$/.test(cell))) {
      flush();
      const headers = tableCells(line), rows: string[][] = [];
      const align = tableCells(lines[i + 1]).map(cell =>
        cell.startsWith(":") && cell.endsWith(":") ? "center" as const : cell.endsWith(":") ? "right" as const : "left" as const);
      i++;
      while (i + 1 < lines.length && lines[i + 1].trim() && lines[i + 1].includes("|")) {
        const cells = tableCells(lines[++i]);
        // Keep surplus cells rather than silently truncating research.
        if (cells.length > headers.length) headers.push(...cells.slice(headers.length).map((_, n) => `Additional field ${n + 1}`));
        rows.push(cells);
      }
      blocks.push({ kind: "table", headers, rows, align });
      continue;
    }
    const heading = !fenced && /^#{1,6}\s+(.+)$/.exec(line);
    const list = !fenced && /^(\s*)(?:(\d+[.)])|([-*+]))\s+(.+)$/.exec(line);
    if (heading) { flush(); blocks.push({ kind: "heading", text: heading[1] }); }
    else if (list) {
      flush(); blocks.push({ kind: "list", marker: list[2] ? list[2].replace(/[.)]$/, "") : "",
        indent: Math.min(24, list[1].length * 3), text: list[4] });
    } else if (!fenced && /^>\s?/.test(line)) {
      flush(); blocks.push({ kind: "quote", text: line.replace(/^>\s?/, "") });
    } else if (!/^[-*_]{3,}$/.test(trimmed)) paragraph.push(trimmed);
  }
  flush();
  return blocks;
}

/** Helvetica supports Latin-1; normalize punctuation without stripping supported accents. */
export function pdfText(text: string): string {
  return text.replace(/[\u2018\u2019\u201A\u2032]/g, "'").replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-").replace(/\u2026/g, "...").replace(/\u2192/g, "->")
    .replace(/[\u00A0\u2007\u202F\u2009\u200A]/g, " ").replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u2022\u25CF\u25AA]/g, "-").normalize("NFC")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "?");
}

export type PdfRun = { text: string; bold?: boolean; url?: string };
export function inlineRuns(text: string, sources: { id: number; url: string }[]): PdfRun[] {
  const runs: PdfRun[] = [];
  const token = /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\[(\d+)\]|(https?:\/\/[^\s)]+))/g;
  let previous = 0;
  const plain = (s: string) => pdfText(s.replace(/<[^>]*>/g, "").replace(/(^|\W)[*_]([^*_]+)[*_](?=\W|$)/g, "$1$2"));
  for (const m of text.matchAll(token)) {
    if (m.index! > previous) runs.push({ text: plain(text.slice(previous, m.index)) });
    if (m[2]) runs.push({ text: pdfText(/^\d+$/.test(m[2]) ? `[${m[2]}]` : m[2]), url: m[3] });
    else if (m[4] || m[5]) runs.push({ text: plain(m[4] || m[5]), bold: true });
    else if (m[6]) runs.push({ text: plain(m[6]) });
    else if (m[8]) runs.push({ text: pdfText(m[8]), url: m[8] });
    else runs.push({ text: m[0], url: sources.find(source => source.id === Number(m[7]))?.url });
    previous = m.index! + m[0].length;
  }
  if (previous < text.length) runs.push({ text: plain(text.slice(previous)) });
  return runs;
}
