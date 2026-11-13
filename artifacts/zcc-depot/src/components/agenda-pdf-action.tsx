import { useRef, useState } from "react";
import { Download, LoaderCircle, Printer } from "lucide-react";
import type { Agenda } from "@workspace/api-client-react";
// Keep export code with the route, never defer a hashed module until the click.
import { agendaPdfFilename, createAgendaPdf } from "@/lib/agenda-pdf";

export function AgendaPdfAction({ agenda, dirty, busy }: { agenda?: Agenda; dirty: boolean; busy: boolean }) {
  const [preparing, setPreparing] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const running = useRef(false);
  async function print(download = false) {
    if (!agenda || dirty || busy || running.current) return;
    running.current = true; setPreparing(true); setMessage(""); setFailed(false);
    // Reserve the viewer synchronously so fetching a logo doesn't trigger popup blocking.
    const filename = agendaPdfFilename(agenda);
    const viewer = download ? null : window.open("about:blank", "_blank");
    if (viewer) { viewer.opener = null; viewer.document.title = "Preparing Demo Agenda PDF"; }
    let warning = "";
    try {
      let logo: string | undefined;
      if (agenda.logoPath) {
        try {
          const response = await fetch(`/api/storage${agenda.logoPath}`, { credentials: "include" });
          if (!response.ok) throw new Error("Logo unavailable");
          const blob = await response.blob();
          logo = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("Logo could not be read"));
            reader.readAsDataURL(blob);
          });
        } catch { warning = "The customer logo was unavailable; the agenda PDF was prepared without it. "; }
      }
      let doc;
      try { doc = createAgendaPdf(agenda, logo); }
      catch (error) {
        if (!logo) throw error;
        doc = createAgendaPdf(agenda);
        warning = "The customer logo could not be included; the agenda PDF was prepared without it. ";
      }
      if (viewer?.closed) { setMessage("PDF preparation canceled."); return; }
      if (!download) doc.autoPrint();
      if (viewer) {
        doc.setProperties({ title: filename });
        const url = URL.createObjectURL(doc.output("blob"));
        viewer.location.href = url;
        window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
        setMessage(`${warning}PDF opened. If your viewer does not open the print dialog automatically, use its Print control.`);
      } else {
        doc.save(filename);
        setMessage(`${warning}${download ? `Downloaded ${filename}` : "Your browser blocked the PDF tab, so the printable PDF was downloaded instead."}`);
      }
    } catch {
      viewer?.close();
      setFailed(true); setMessage("The agenda PDF could not be prepared. Your saved agenda is unchanged. Please retry.");
    } finally { running.current = false; setPreparing(false); }
  }
  return (
    <div className="min-w-0 rounded-2xl border border-[#b9c9b9] bg-[#edf2e5] p-3" data-testid="agenda-pdf-controls">
      <p className="mb-2 text-sm font-semibold text-[#294735]">Agenda PDF</p>
      <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => void print()} disabled={!agenda || dirty || busy || preparing} data-testid="button-print-agenda-pdf"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#829589] bg-[#fffefa] px-5 py-2.5 text-sm font-semibold text-[#294735] transition hover:bg-[#e8eddf] disabled:cursor-not-allowed disabled:opacity-50">
        {preparing ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Printer className="h-4 w-4" aria-hidden />}
        {preparing ? "Preparing PDF…" : "Print PDF"}
      </button>
      <button type="button" onClick={() => void print(true)} disabled={!agenda || dirty || busy || preparing} data-testid="button-download-agenda-pdf"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#cbd6ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#294735] transition hover:bg-[#e8eddf] disabled:cursor-not-allowed disabled:opacity-50">
        <Download className="h-4 w-4" aria-hidden /> Download PDF
      </button>
      </div>
      {!agenda ? <p className="mt-2 text-xs text-[#536157]">Save agenda to enable PDF export.</p>
        : dirty && <p className="mt-2 text-xs text-[#536157]">Save your changes to enable Print PDF.</p>}
      {message && <p role={failed ? "alert" : "status"} className="mt-2 max-w-md text-xs leading-relaxed text-[#536157]">{message}</p>}
    </div>
  );
}
