import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Copy, Presentation, Search, ShieldAlert, X } from "lucide-react";
import { CATEGORIES, INDUSTRIES, USE_CASES, USE_CASE_SOURCES, filterUseCases, useCaseSummary } from "@/data/verticals";
import { PageHero } from "@/components/kit";
import { useToast } from "@/hooks/use-toast";
import { IndustryIcon } from "@/components/vertical-use-cases/industry-icon";
import { KindBadge, UseCaseDetail } from "@/components/vertical-use-cases/use-case-detail";
import "@/components/vertical-use-cases/vuc.css";

const ALL = "all";
const TITLE = "Use Cases by Vertical | ZCC Depot";
const DESCRIPTION = "Forty-five curated, hypothetical Zendesk Contact Center use cases across nine industries: challenge, solution, workflow, outcomes, demo path and discovery questions.";

type UrlState = { industry: string; category: string; q: string; uc: string };
function readUrl(): UrlState {
  const p = new URLSearchParams(window.location.search);
  return { industry: p.get("industry") ?? ALL, category: p.get("category") ?? ALL, q: p.get("q") ?? "", uc: p.get("case") ?? "" };
}
function writeUrl(s: UrlState, push: boolean) {
  const p = new URLSearchParams();
  if (s.industry !== ALL) p.set("industry", s.industry);
  if (s.category !== ALL) p.set("category", s.category);
  if (s.q) p.set("q", s.q);
  if (s.uc) p.set("case", s.uc);
  const qs = p.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
  if (url === `${window.location.pathname}${window.location.search}`) return;
  window.history[push ? "pushState" : "replaceState"](window.history.state, "", url);
}

function usePageMeta() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = TITLE;
    const meta = [['meta[name="description"]', DESCRIPTION], ['meta[property="og:title"]', TITLE], ['meta[property="og:description"]', DESCRIPTION]].map(([sel, content]) => {
      const el = document.querySelector<HTMLMetaElement>(sel);
      const previous = el?.getAttribute("content") ?? "";
      el?.setAttribute("content", content);
      return { el, previous };
    });
    return () => { document.title = prevTitle; meta.forEach(({ el, previous }) => el?.setAttribute("content", previous)); };
  }, []);
}

export default function SalesUseCases() {
  usePageMeta();
  const reduce = useReducedMotion();
  const { toast } = useToast();
  const [state, setState] = useState<UrlState>(readUrl);
  const [presenting, setPresenting] = useState(false);
  const presentBtn = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPop = () => setState(readUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const update = useCallback((patch: Partial<UrlState>, push = true) => {
    setState(prev => { const next = { ...prev, ...patch }; writeUrl(next, push); return next; });
  }, []);

  const results = useMemo(() => filterUseCases({ query: state.q, industryId: state.industry, category: state.category }), [state.q, state.industry, state.category]);
  const selected = results.find(u => u.id === state.uc) ?? results[0];
  const industry = INDUSTRIES.find(i => i.id === (selected?.industryId ?? state.industry));
  const filterIndustry = INDUSTRIES.find(i => i.id === state.industry);
  const idx = selected ? results.findIndex(u => u.id === selected.id) : -1;
  const prev = idx > 0 ? results[idx - 1] : undefined;
  const next = idx >= 0 && idx < results.length - 1 ? results[idx + 1] : undefined;
  const industryName = (id: string) => INDUSTRIES.find(i => i.id === id)?.name ?? "";

  const go = useCallback((id?: string) => { if (id) update({ uc: id }); }, [update]);

  const copy = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(useCaseSummary(selected));
      toast({ title: "Summary copied", description: selected.title });
    } catch {
      toast({ title: "Copy unavailable", description: "Your browser blocked clipboard access.", variant: "destructive" });
    }
  };

  // Presentation: Escape closes, arrows navigate, focus trapped and restored.
  const navRef = useRef({ prev, next });
  navRef.current = { prev, next };
  useEffect(() => {
    if (!presenting) return;
    const restore = presentBtn.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); setPresenting(false); return; }
      const t = e.target as HTMLElement;
      if (e.key === "ArrowRight" && !t.closest("input,textarea")) go(navRef.current.next?.id);
      if (e.key === "ArrowLeft" && !t.closest("input,textarea")) go(navRef.current.prev?.id);
      if (e.key === "Tab" && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>("button:not(:disabled),a[href],[tabindex]:not([tabindex='-1'])");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; restore?.focus(); };
  }, [presenting, go]);

  const pager = (dark = false, suffix = "") => (
    <div className="flex items-center gap-1.5">
      <button type="button" className={`depot-btn ${dark ? "depot-btn-outline" : "depot-btn-ghost"}`} disabled={!prev} onClick={() => go(prev?.id)} aria-label={prev ? `Previous: ${prev.title}` : "No previous use case"} data-testid={`button-prev${dark ? "-present" : suffix}`}><ChevronLeft className="h-4 w-4" aria-hidden />Previous</button>
      <span className="mono px-1 text-xs opacity-60" aria-live="polite">{idx + 1} / {results.length}</span>
      <button type="button" className={`depot-btn ${dark ? "depot-btn-outline" : "depot-btn-ghost"}`} disabled={!next} onClick={() => go(next?.id)} aria-label={next ? `Next: ${next.title}` : "No next use case"} data-testid={`button-next${dark ? "-present" : suffix}`}>Next<ChevronRight className="h-4 w-4" aria-hidden /></button>
    </div>
  );

  const fade = reduce ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 } } : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

  return (
    <div className="vuc">
      <PageHero eyebrow="Industry solutions" motif="brief" title="Use Cases by Vertical"
        lede={<><span className="vuc-sub block mb-1.5">Real-world challenges. Intelligent solutions. Measurable outcomes.</span>Explore how Zendesk Contact Center can help organizations across nine industries modernize customer engagement, streamline operations, and deliver more connected customer experiences.</>} />

      <div className="vuc-body">
        <div className="vuc-tools" id="explore" data-section-nav>
          <label className="vuc-search">
            <Search className="h-4 w-4 text-[#11110D]/50" aria-hidden />
            <span className="sr-only">Search all {USE_CASES.length} use cases</span>
            <input type="search" value={state.q} placeholder={`Search ${USE_CASES.length} use cases, e.g. "rebooking" or "disputes"`}
              onChange={e => update({ q: e.target.value, uc: "" }, false)} data-testid="input-search-usecases" />
            {state.q && <button type="button" aria-label="Clear search" onClick={() => update({ q: "", uc: "" }, false)} data-testid="button-clear-search"><X className="h-4 w-4" aria-hidden /></button>}
          </label>
          <div className="vuc-cats" role="group" aria-label="Filter by category">
            {[ALL, ...CATEGORIES].map(c => (
              <button key={c} type="button" className={`room-pill shrink-0 ${state.category === c ? "is-on" : ""}`} aria-pressed={state.category === c}
                onClick={() => update({ category: c, uc: "" })} data-testid={`filter-category-${c.replace(/\W+/g, "-").toLowerCase()}`}>{c === ALL ? "All categories" : c}</button>
            ))}
          </div>
        </div>

        <div className="vuc-industries" role="group" aria-label="Choose an industry" id="industries" data-section-nav>
          {INDUSTRIES.map(ind => {
            const on = state.industry === ind.id;
            const count = USE_CASES.filter(u => u.industryId === ind.id).length;
            return (
              <button key={ind.id} type="button" className={`vuc-ind ${on ? "is-on" : ""}`} aria-pressed={on}
                onClick={() => {
                  update({ industry: on ? ALL : ind.id, uc: "" });
                  document.getElementById("workspace")?.scrollIntoView({ behavior: reduce ? "instant" : "smooth", block: "start" });
                }} data-testid={`card-industry-${ind.id}`}>
                <span className="vuc-ind-count">{count} use cases</span>
                <span className="vuc-ind-icon"><IndustryIcon name={ind.icon} /></span>
                <strong className="mt-1 text-[0.95rem] leading-tight">{ind.name}</strong>
                <span className={`text-xs leading-snug ${on ? "text-[#F5F5F2]/70" : "text-[#11110D]/60"}`}>{ind.description}</span>
                <span className="vuc-ind-cta">{on ? "Selected · click to show all" : "Explore use cases"}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {industry && (
            <motion.aside key={industry.id} className="vuc-qual" role="note" aria-label={`${industry.name} qualification`} {...fade} transition={{ duration: 0.25 }}>
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div><strong className="block">{industry.name} qualification</strong>{industry.qualification}</div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="vuc-work" id="workspace" data-section-nav>
          <label className="vuc-mobile-picker">
            <span className="eyebrow">{results.length} use cases shown · Choose a scenario</span>
            <select value={selected?.id ?? ""} onChange={event => go(event.target.value)} data-testid="select-mobile-usecase">
              {results.length === 0 && <option value="">No matching use cases</option>}
              {results.map(useCase => <option key={useCase.id} value={useCase.id}>{industryName(useCase.industryId)} · {useCase.title}</option>)}
            </select>
          </label>
          <nav aria-label="Use cases" className="vuc-list">
            <div className="eyebrow mb-1 flex justify-between text-[#11110D]/55"><span>{filterIndustry?.name ?? "All industries"}</span><span data-testid="text-result-count">{results.length} shown</span></div>
            {results.map((u, i) => (
              <button key={u.id} type="button" className={`vuc-case ${selected?.id === u.id ? "is-on" : ""}`} aria-current={selected?.id === u.id ? "true" : undefined}
                onClick={() => go(u.id)} data-testid={`button-usecase-${u.id}`}>
                <span className="room-index">{i + 1}</span>
                <span>{u.title}<small>{state.industry === ALL ? `${industryName(u.industryId)} · ` : ""}{u.category}</small></span>
              </button>
            ))}
          </nav>

          <div className="vuc-stage" aria-live="polite">
            {!selected || results.length === 0 ? (
              <div className="vuc-empty">
                <p className="text-lg font-semibold">No use cases match those filters.</p>
                <p className="mt-1 text-sm text-[#11110D]/60">Try a broader term or reset to all industries and categories.</p>
                <button type="button" className="depot-btn depot-btn-ink mt-4" onClick={() => update({ q: "", industry: ALL, category: ALL, uc: "" })} data-testid="button-reset-filters">Reset filters</button>
              </div>
            ) : (
              <>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  {pager()}
                  <div className="vuc-actions">
                    <button type="button" className="depot-btn depot-btn-ghost" onClick={copy} data-testid="button-copy-summary"><Copy className="h-4 w-4" aria-hidden />Copy summary</button>
                    <button ref={presentBtn} type="button" className="depot-btn depot-btn-ink" onClick={() => setPresenting(true)} data-testid="button-present"><Presentation className="h-4 w-4" aria-hidden />Present full screen</button>
                  </div>
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={selected.id} {...fade} transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}>
                    <UseCaseDetail useCase={selected} industry={industry} sources={USE_CASE_SOURCES} />
                  </motion.div>
                </AnimatePresence>
                <div className="mt-8 border-t border-[var(--line)] pt-4">{pager(false, "-bottom")}</div>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-[#11110D]/60" id="legend" data-section-nav>
          <span className="eyebrow mr-1">Legend</span>
          <KindBadge kind="Zendesk capability" /><KindBadge kind="AWS configuration" /><KindBadge kind="External integration" /><KindBadge kind="Conceptual workflow" />
          <span className="basis-full mt-2 leading-relaxed">All scenarios are curated, hypothetical examples built from public documentation. They describe platform building blocks, not a configured live solution, compliance certification or quantified result. Confirm capabilities with current Zendesk and AWS documentation.</span>
        </div>
      </div>

      {presenting && selected && (
        <div ref={dialogRef} className="vuc-present" role="dialog" aria-modal="true" aria-label={`Presenting: ${selected.title}`} tabIndex={-1} data-testid="dialog-present">
          <div className="vuc-present-bar on-dark">
            <span className="eyebrow hidden truncate text-[#D1F470] sm:block">{industry?.name} · Use Cases by Vertical</span>
            <div className="flex items-center gap-2">
              {pager(true)}
              <button type="button" className="depot-btn depot-btn-lime" onClick={() => setPresenting(false)} data-testid="button-exit-present"><X className="h-4 w-4" aria-hidden />Exit<span className="sr-only"> presentation (Escape)</span></button>
            </div>
          </div>
          {industry && <p className="mb-4 rounded-xl border border-[#d8c79b] bg-[#EFE6D2] px-4 py-2.5 text-sm text-[#3d2e08]"><strong>Qualification: </strong>{industry.qualification}</p>}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={selected.id} className="vuc-stage is-present mx-auto max-w-6xl" {...fade} transition={{ duration: 0.3 }}>
              <UseCaseDetail useCase={selected} industry={industry} sources={USE_CASE_SOURCES} present />
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
