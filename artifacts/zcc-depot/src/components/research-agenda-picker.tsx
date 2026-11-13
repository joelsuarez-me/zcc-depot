import { useEffect, useRef, useState } from "react";
import { ArrowRight, FileText, LoaderCircle, RefreshCw, Search } from "lucide-react";
import { getResearchAgendaDraft, useListResearchReports, type AgendaInput, type SavedResearchSummary } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50";
const date = (value: string) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export function ResearchAgendaPicker({ open, onOpenChange, userId, onLogin, onDraft }: {
  open: boolean; onOpenChange: (open: boolean) => void; userId: string | null; onLogin: () => void;
  onDraft: (draft: AgendaInput, report: SavedResearchSummary) => boolean;
}) {
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const request = useRef<AbortController | null>(null);
  const library = useListResearchReports({ query: {
    queryKey: ["agenda-research-picker", userId], enabled: open && !!userId, staleTime: 0, retry: false,
  } });
  useEffect(() => {
    setSearch(""); setPending(null); setError(""); setExpired(false);
    return () => { request.current?.abort(); request.current = null; };
  }, [open, userId]);

  async function select(report: SavedResearchSummary) {
    if (request.current || !userId) return;
    const controller = new AbortController();
    request.current = controller; setPending(report.id); setError(""); setExpired(false);
    try {
      const draft = await getResearchAgendaDraft(report.id, { signal: controller.signal });
      if (!controller.signal.aborted && onDraft(draft, report)) onOpenChange(false);
    } catch (err) {
      if (controller.signal.aborted) return;
      const status = (err as { status?: number })?.status;
      setExpired(status === 401);
      const detail = (err as { data?: { error?: string } })?.data?.error;
      setError(status === 401 ? "Your session expired. Sign in again to prepare an agenda." :
        detail || "The agenda draft could not be prepared. Your current agenda and saved research are unchanged. Try again.");
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(null); }
    }
  }

  const listExpired = (library.error as { status?: number } | null)?.status === 401;
  const reports = (library.data ?? []).filter(item => [item.companyName, item.region, item.audience]
    .some(value => value.toLowerCase().includes(search.trim().toLowerCase())));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-2xl rounded-2xl border-[#cbd1c5] bg-[#fbfbf6] text-[#203a2c]" data-testid="dialog-research-to-agenda">
        <DialogHeader>
          <span className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-[#244b39] text-[#d1f470]"><FileText className="h-5 w-5" aria-hidden /></span>
          <DialogTitle className="pr-5 text-xl leading-tight">Convert Demo Research to Demo Agenda</DialogTitle>
          <DialogDescription className="leading-relaxed text-[#536157]">
            Choose saved research to prepare a new draft. Review and edit it before selecting Save agenda. Nothing is saved by converting.
          </DialogDescription>
        </DialogHeader>
        {!userId ? <button type="button" onClick={onLogin} className={`${button} bg-[#244b39] text-white`}>Sign in to choose research</button> : <>
          <label className="relative block">
            <span className="sr-only">Search saved research</span>
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#536157]" aria-hidden />
            <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company, region or audience"
              className="min-h-11 w-full rounded-xl border border-[#cbd1c5] bg-white py-2 pl-9 pr-3 text-sm" data-testid="input-agenda-research-search" />
          </label>
          <p className="text-xs text-[#536157]">Shared saved reports · no new AI research is run</p>
          {library.isLoading ? <p role="status" className="flex items-center gap-2 py-5"><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />Loading saved research…</p> :
            library.isError ? <div role="alert" className="rounded-xl bg-[#f8e9e3] p-4">
              <p>{listExpired ? "Your session expired. Sign in again to load saved research." : "Saved research could not be loaded."}</p>
              <button type="button" onClick={() => listExpired ? onLogin() : void library.refetch()} className={`${button} mt-2 bg-white`}>
                <RefreshCw className="h-4 w-4" aria-hidden />{listExpired ? "Sign in again" : "Retry"}
              </button>
            </div> :
            !library.data?.length ? <div className="rounded-xl border border-dashed border-[#829589] p-5 text-center">
              <p className="font-semibold">No saved research yet</p>
              <p className="mt-1 text-sm text-[#536157]">Generate and save a report in Demo Researcher, then return here.</p>
              <a className={`${button} mt-3 bg-[#244b39] text-white`} href={`${import.meta.env.BASE_URL}demos/brief`}>Open Demo Researcher <ArrowRight className="h-4 w-4" aria-hidden /></a>
            </div> :
            !reports.length ? <p role="status" className="py-4 text-sm">No saved reports match your search.</p> :
            <ul className="max-h-[38dvh] space-y-2 overflow-y-auto pr-1" aria-label="Saved research reports">
              {reports.map(report => <li key={report.id} className="rounded-xl border border-[#d9ddd2] bg-white p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 break-words">
                    <p className="font-semibold">{report.companyName}</p>
                    <p className="mt-1 text-xs text-[#536157]">{report.region} · {report.audience}</p>
                    <p className="mt-1 text-xs text-[#536157]">Researched {date(report.researchedAt)} · Saved {date(report.savedAt)}</p>
                  </div>
                  <button type="button" onClick={() => void select(report)} disabled={!!pending}
                    aria-label={`Create editable draft for ${report.companyName}`} data-testid={`button-draft-research-${report.id}`}
                    className={`${button} shrink-0 bg-[#d1f470] text-[#17251e]`}>
                    {pending === report.id ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />}
                    {pending === report.id ? "Preparing…" : "Use research"}
                  </button>
                </div>
              </li>)}
            </ul>}
          {error && <div role="alert" className="rounded-xl bg-[#f8e9e3] p-3 text-sm text-[#723e31]">{error}
            {expired && <button type="button" onClick={onLogin} className={`${button} mt-2 bg-white`}>Sign in again</button>}
          </div>}
        </>}
      </DialogContent>
    </Dialog>
  );
}
