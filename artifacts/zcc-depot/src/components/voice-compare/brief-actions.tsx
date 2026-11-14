import { useRef, useState } from "react";
import { Download, LoaderCircle, Printer } from "lucide-react";
import type { FitSignalId } from "@/data/voice-comparison";
// Load with this route, not on the click: older published tabs must retain their exporter.
import { comparisonBriefFilename, createComparisonBriefPdf } from "@/lib/comparison-brief-pdf";

export function ComparisonBriefActions({ selected }: { selected: readonly FitSignalId[] }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const running = useRef(false);
  async function exportBrief(download: boolean) {
    if (running.current) return;
    running.current = true; setBusy(true); setMessage(""); setFailed(false);
    let viewer: Window | null = null;
    try {
      if (!download) {
        viewer = window.open("about:blank", "_blank");
        if (viewer) { viewer.opener = null; viewer.document.title = "Preparing comparison brief"; }
      }
      const filename = comparisonBriefFilename();
      const doc = createComparisonBriefPdf(selected);
      if (viewer?.closed) { setMessage("Printing canceled. You can still download the brief."); return; }
      if (viewer) {
        doc.setProperties({ title: filename });
        doc.autoPrint();
        const url = URL.createObjectURL(doc.output("blob"));
        viewer.location.href = url;
        window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
        setMessage("Brief opened in a PDF tab. Use the viewer’s Print or Download control if needed.");
      } else {
        await doc.save(filename, { returnPromise: true });
        setMessage(download ? `Downloaded ${filename}` : "Your browser blocked the print tab, so the PDF brief was downloaded instead.");
      }
    } catch {
      viewer?.close();
      setFailed(true);
      setMessage("The PDF brief could not be prepared. Your selections are unchanged. Please try again.");
    } finally { running.current = false; setBusy(false); }
  }
  const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D1F470]";
  return (
    <div className="mt-4" data-testid="comparison-brief-controls">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${buttonClass} bg-[#D1F470] text-[#11110D] hover:bg-[#e0ff98]`} disabled={busy} onClick={() => void exportBrief(false)} data-testid="button-print-brief">
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Printer className="h-4 w-4" aria-hidden />}
          {busy ? "Preparing brief…" : "Print brief"}
        </button>
        <button type="button" className={`${buttonClass} border border-white/40 text-white hover:bg-white/10`} disabled={busy} onClick={() => void exportBrief(true)} data-testid="button-download-comparison-brief">
          <Download className="h-4 w-4" aria-hidden />Download PDF
        </button>
      </div>
      <p className="mt-2 text-xs text-white/75">Executive summary PDF{selected.length ? ` · Includes ${selected.length} selected fit signal${selected.length === 1 ? "" : "s"}` : " · Select fit signals below to personalize it"}.</p>
      {message && <p className={`mt-2 max-w-2xl text-sm ${failed ? "text-[#ffdbcb]" : "text-[#D1F470]"}`} role={failed ? "alert" : "status"} data-testid="text-comparison-brief-status">{message}</p>}
    </div>
  );
}
