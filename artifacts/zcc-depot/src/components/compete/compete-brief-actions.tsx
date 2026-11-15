import { useRef, useState } from "react";
import { Download, LoaderCircle, Printer } from "lucide-react";
import type { CompeteBattlecard } from "@workspace/api-client-react";
import { createCompeteBriefPdf, competeBriefFilename } from "@/lib/compete-brief-pdf";

/** Same eagerly loaded executive PDF theme as the site's latest Print brief. */
export function CompeteBriefActions({ data }: { data: CompeteBattlecard }) {
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  async function exportPdf(download: boolean) {
    if (running.current) return;
    running.current = true; setBusy(true); setMessage(""); setFailed(false);
    let viewer: Window | null = null;
    try {
      if (!download) {
        viewer = window.open("about:blank", "_blank");
        if (viewer) { viewer.opener = null; viewer.document.title = "Preparing competitive brief"; }
      }
      const date = new Date(), filename = competeBriefFilename(data.name, date);
      const doc = createCompeteBriefPdf(data, `${window.location.origin}${window.location.pathname}`, date);
      doc.setProperties({ title: filename });
      if (viewer?.closed) { setMessage("Printing canceled. You can still download the PDF."); return; }
      if (viewer) {
        doc.autoPrint();
        const url = URL.createObjectURL(doc.output("blob"));
        viewer.location.href = url;
        window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
        setMessage("Brief opened. Use the PDF viewer’s Print or Download control if needed.");
      } else {
        await doc.save(filename, { returnPromise: true });
        setMessage(download ? `Downloaded ${filename}` : "Print tab blocked. The PDF was downloaded instead.");
      }
    } catch (error) {
      viewer?.close(); setFailed(true);
      setMessage(error instanceof Error ? `PDF unavailable: ${error.message}` : "The PDF could not be prepared. Please retry.");
    } finally { running.current = false; setBusy(false); }
  }
  return (
    <div className="mt-3" data-brief-exclude data-testid="compete-pdf-actions">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void exportPdf(false)} className="cmp-btn lime min-h-11" data-testid="button-compete-print">
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Printer className="h-4 w-4" aria-hidden />}{busy ? "Preparing…" : "Print to PDF"}
        </button>
        <button type="button" disabled={busy} onClick={() => void exportPdf(true)} className="cmp-btn ghost min-h-11" data-testid="button-compete-download"><Download className="h-4 w-4" aria-hidden />Download PDF</button>
      </div>
      {message && <p className="mt-2 text-sm text-[#F5F5F2]/85" role={failed ? "alert" : "status"}>{message}</p>}
    </div>
  );
}
