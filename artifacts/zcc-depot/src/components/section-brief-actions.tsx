import { useRef, useState } from "react";
import { Download, LoaderCircle, Printer } from "lucide-react";
import { captureSectionBrief } from "@/lib/section-brief-content";
// Eagerly load with the UI, avoiding stale hashed-module failures on a later click.
import { createSectionBriefPdf, sectionBriefFilename } from "@/lib/section-brief-pdf";
import "./section-brief.css";

export function SectionBriefActions({ sectionId, dark = false }: { sectionId?: string; dark?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const running = useRef(false);
  const [busy, setBusy] = useState(false), [failed, setFailed] = useState(false), [message, setMessage] = useState("");
  async function exportBrief(download: boolean) {
    if (running.current) return;
    running.current = true; setBusy(true); setFailed(false); setMessage("");
    let viewer: Window | null = null;
    try {
      const scope = root.current?.closest<HTMLElement>("[data-brief-scope],section");
      if (!scope) throw new Error("This section could not be identified. Please reopen the page and try again.");
      const content = captureSectionBrief(scope, sectionId);
      if (!download) {
        viewer = window.open("about:blank", "_blank");
        if (viewer) { viewer.opener = null; viewer.document.title = "Preparing section brief"; }
      }
      const filename = sectionBriefFilename(content.title), doc = createSectionBriefPdf(content);
      if (viewer?.closed) { setMessage("Printing canceled. You can still download this brief."); return; }
      if (viewer) {
        doc.setProperties({ title: filename }); doc.autoPrint();
        const url = URL.createObjectURL(doc.output("blob"));
        viewer.location.href = url;
        window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
        setMessage("Section brief opened. Use the PDF viewer’s Print or Download control if needed.");
      } else {
        await doc.save(filename, { returnPromise: true });
        setMessage(download ? `Downloaded ${filename}` : "The print tab was blocked, so the PDF brief was downloaded instead.");
      }
    } catch (error) {
      viewer?.close(); setFailed(true);
      setMessage(error instanceof Error ? `Brief unavailable: ${error.message}` : "This brief could not be prepared. Please try again.");
    } finally { running.current = false; setBusy(false); }
  }
  return (
    <div ref={root} className={`section-brief-controls ${dark ? "is-dark" : ""}`} data-brief-exclude data-testid={`section-brief-${sectionId ?? "content"}`}>
      <div className="section-brief-buttons">
        <button type="button" disabled={busy} onClick={() => void exportBrief(false)} aria-label={sectionId ? `Print brief for ${sectionId.replace(/-/g, " ")}` : "Print this section as a brief"}>
          {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Printer className="h-3.5 w-3.5" aria-hidden />}
          {busy ? "Preparing…" : "Print brief"}
        </button>
        <button type="button" disabled={busy} onClick={() => void exportBrief(true)} aria-label={sectionId ? `Download PDF brief for ${sectionId.replace(/-/g, " ")}` : "Download this section’s brief as a PDF"}><Download className="h-3.5 w-3.5" aria-hidden />Download PDF</button>
      </div>
      {message && <p className="section-brief-status" role={failed ? "alert" : "status"}>{message}</p>}
    </div>
  );
}
