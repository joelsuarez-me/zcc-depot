import { useId, useMemo, useState } from "react";
import { AlertTriangle, Bookmark, CalendarRange, Check, ChevronDown, FolderOpen, Library, Loader2, LogIn, RefreshCw, Search } from "lucide-react";
import type { ResearchLibraryController } from "@/lib/use-research-library";
import { SectionLink } from "@/components/section-link";

const PAGE = 6;
const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";
const agendaHref = (id: string) => `${import.meta.env.BASE_URL}agenda?agenda=${encodeURIComponent(id)}`;

function fmt(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function ResearchLibrary({ library, signedIn, onLogin }: { library: ResearchLibraryController; signedIn: boolean; onLogin: () => void }) {
  const { items, loading, listError, error, notice, action, saved, hasReport } = library;
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const listId = useId();
  const searchId = useId();
  const idle = action === "idle";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => [i.companyName, i.region, i.audience].some(v => v.toLowerCase().includes(q)));
  }, [items, query]);
  const visible = filtered.slice(0, limit);

  if (!signedIn) {
    return (
      <section id="research-library" data-section-nav aria-labelledby="research-library-title" className="scroll-mt-24 rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8] p-5" data-testid="panel-research-library">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#203524] text-[#D1F470]"><Library className="h-5 w-5" aria-hidden /></span>
            <div>
              <div className="flex min-w-0 items-center gap-1">
                <h2 id="research-library-title" className="text-lg font-semibold tracking-tight text-[#11110D]">Shared research library</h2>
                <SectionLink id="research-library" label="Shared research library" />
              </div>
              <p className="text-sm text-[#11110D]/60">Sign in to save reports, reopen research shared by portal users and convert research to an agenda.</p>
            </div>
          </div>
          <button type="button" onClick={onLogin} className={`${btn} bg-[#203524] text-[#D1F470] hover:bg-[#2b4630]`} data-testid="button-library-login">
            <LogIn className="h-4 w-4" aria-hidden /> Sign in
          </button>
        </div>
      </section>
    );
  }

  const saveLabel = action === "saving" ? "Saving report" : saved ? "Saved" : "Save report";
  const convertBusy = action === "converting";

  return (
    <section id="research-library" data-section-nav aria-labelledby="research-library-title" aria-busy={loading || !idle} className="scroll-mt-24 rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8] p-4 md:p-5" data-testid="panel-research-library">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#203524] text-[#D1F470]"><Library className="h-5 w-5" aria-hidden /></span>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1">
              <h2 id="research-library-title" className="text-lg font-semibold tracking-tight text-[#11110D]">Shared research library</h2>
              <SectionLink id="research-library" label="Shared research library" />
            </div>
            <p className="text-sm text-[#11110D]/60">
              <span className="mono text-xs" data-testid="text-library-count">{loading && !items.length ? "Loading" : `${items.length} saved`}</span>
              <span aria-hidden> · </span>Shared with all signed-in portal users
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void library.save()} disabled={!hasReport || !idle || !!saved}
            className={`${btn} border border-[#203524]/25 bg-[#F5F5F2] text-[#203524] hover:bg-[#203524]/8`} data-testid="button-save-research">
            {action === "saving" ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : saved ? <Check className="h-4 w-4" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
            {saveLabel}
          </button>
          {saved?.agendaId ? (
            <a href={agendaHref(saved.agendaId)} className={`${btn} bg-[#D1F470] text-[#11110D] hover:bg-[#c3ea55]`} data-testid="link-open-converted-agenda">
              <CalendarRange className="h-4 w-4" aria-hidden /> Open Agenda
            </a>
          ) : (
            <button type="button" onClick={() => void library.convert()} disabled={!hasReport || !idle}
              className={`${btn} bg-[#203524] text-[#D1F470] hover:bg-[#2b4630]`} data-testid="button-convert-agenda">
              {convertBusy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <CalendarRange className="h-4 w-4" aria-hidden />}
              {convertBusy ? "Creating agenda" : "Convert Research to Agenda"}
            </button>
          )}
          <button type="button" onClick={() => setExpanded(v => !v)} aria-expanded={expanded} aria-controls={listId}
            className={`${btn} text-[#11110D]/75 hover:bg-[#203524]/8`} data-testid="button-toggle-library">
            {expanded ? "Hide saved reports" : "Show saved reports"}
            <ChevronDown className={`h-4 w-4 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} aria-hidden />
          </button>
        </div>
      </div>

      <div aria-live="polite" role="status" className="empty:hidden">
        {notice && <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#D1F470]/35 px-3 py-2 text-sm text-[#203524]" data-testid="text-library-notice"><Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{notice}</p>}
        {action === "opening" && <p className="mt-3 flex items-center gap-2 text-sm text-[#203524]"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />Opening saved report</p>}
      </div>
      {!hasReport && <p className="mt-3 text-xs text-[#11110D]/55">Generate or open a report to save it or convert it to an agenda.</p>}
      {error && (
        <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-[#9a4b2a]/30 bg-[#9a4b2a]/8 px-3 py-2 text-sm text-[#9a4b2a]" data-testid="text-library-error">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{error}
        </p>
      )}

      <div id={listId} hidden={!expanded} className="mt-4 border-t border-[#11110D]/10 pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor={searchId} className="sr-only">Search saved reports by company, region or audience</label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#11110D]/35" aria-hidden />
            <input id={searchId} type="search" value={query} onChange={e => { setQuery(e.target.value); setLimit(PAGE); }}
              placeholder="Search company, region or audience" data-testid="input-library-search"
              className="min-h-11 w-full rounded-xl border border-[#11110D]/15 bg-[#F5F5F2] py-2.5 pl-9 pr-3.5 text-sm text-[#11110D] outline-none transition-colors placeholder:text-[#11110D]/35 focus:border-[#203524] focus:bg-[#FDFDFB]" />
          </div>
          <button type="button" onClick={() => void library.refresh()} disabled={loading}
            className={`${btn} border border-[#11110D]/15 text-[#203524] hover:bg-[#203524]/8`} data-testid="button-library-refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden />{loading ? "Refreshing" : "Refresh"}
          </button>
        </div>

        {listError ? (
          <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#9a4b2a]/30 bg-[#9a4b2a]/8 px-3 py-2 text-sm text-[#9a4b2a]" data-testid="text-library-list-error">
            <span className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{listError}</span>
            <button type="button" onClick={() => void library.refresh()} className={`${btn} text-[#9a4b2a] underline underline-offset-4`} data-testid="button-library-retry">Retry</button>
          </div>
        ) : loading && !items.length ? (
          <div className="mt-3 space-y-2" aria-hidden data-testid="skeleton-library">
            {[0, 1, 2].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-[#11110D]/[.06] motion-reduce:animate-none" />)}
          </div>
        ) : !items.length ? (
          <div className="mt-3 rounded-xl border border-dashed border-[#203524]/25 px-4 py-5 text-center" data-testid="text-library-empty">
            <p className="text-sm font-semibold text-[#11110D]">No saved research yet</p>
            <p className="mt-1 text-xs text-[#11110D]/55">Saved reports appear here for every signed-in portal user.</p>
          </div>
        ) : !filtered.length ? (
          <p className="mt-3 rounded-xl bg-[#11110D]/[.04] px-4 py-4 text-sm text-[#11110D]/65" data-testid="text-library-no-match">
            No saved reports match "{query.trim()}".{" "}
            <button type="button" onClick={() => setQuery("")} className="min-h-11 font-semibold text-[#203524] underline underline-offset-4">Clear search</button>
          </p>
        ) : (
          <>
            <p className="sr-only" role="status">{`${filtered.length} saved reports${query.trim() ? " match the search" : ""}`}</p>
            <ul className="mt-3 divide-y divide-[#11110D]/8 overflow-hidden rounded-2xl border border-[#11110D]/10 bg-[#F5F5F2]">
              {visible.map(item => {
                const current = saved?.id === item.id;
                return (
                  <li key={item.id} className={`flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between ${current ? "bg-[#D1F470]/25" : ""}`} data-testid={`row-research-${item.id}`}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#11110D]">
                        {item.companyName}{current && <span className="mono ml-2 rounded-full bg-[#203524] px-2 py-0.5 text-[0.62rem] uppercase tracking-wider text-[#D1F470]">On screen</span>}
                      </p>
                      <p className="text-xs text-[#11110D]/60">{item.audience}<span aria-hidden> · </span>{item.region}</p>
                      <p className="mono text-[0.68rem] text-[#11110D]/45">Saved {fmt(item.savedAt)}<span aria-hidden> · </span>Researched {fmt(item.researchedAt)}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      <button type="button" onClick={() => void library.open(item.id)} disabled={!idle}
                        aria-label={`Open saved research for ${item.companyName}`}
                        className={`${btn} min-h-11 border border-[#203524]/20 bg-[#FBFBF8] px-3.5 text-[#203524] hover:bg-[#203524] hover:text-[#D1F470]`} data-testid={`button-open-research-${item.id}`}>
                        <FolderOpen className="h-4 w-4" aria-hidden /> Open
                      </button>
                      {item.agendaId && (
                        <a href={agendaHref(item.agendaId)} aria-label={`Open Agenda for ${item.companyName}`}
                          className={`${btn} px-3.5 text-[#203524] hover:bg-[#D1F470]/60`} data-testid={`link-research-agenda-${item.id}`}>
                          <CalendarRange className="h-4 w-4" aria-hidden /> Open Agenda
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {filtered.length > limit && (
              <button type="button" onClick={() => setLimit(l => l + PAGE)}
                className={`${btn} mt-2 w-full text-[#203524] hover:bg-[#203524]/8`} data-testid="button-library-more">
                Show more ({filtered.length - limit} older)
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
