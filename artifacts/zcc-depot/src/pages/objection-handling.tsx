import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Check, Copy, CornerDownRight, ExternalLink, FileText, Link2, RotateCw, Search, ShieldAlert, Siren, X } from "lucide-react";
import { useGetObjectionHandling, getGetObjectionHandlingQueryKey } from "@workspace/api-client-react";
import type { ObjectionCategory, ObjectionHandlingGuide, ObjectionResponse, ObjectionSource } from "@workspace/api-client-react";
import { useDepot } from "@/lib/depot-mode";
import { useCompeteMeta } from "@/components/compete/compete-kit";
import { ALL_CATEGORIES, countByCategory, filterObjections, formatResponseForCopy, objectionIdFromHash, objectionLink } from "@/components/objection-handling/filter";
import "@/styles/objection-handling.css";

const TITLE = "Objection handling | ZCC Depot";
const DESC = "Presenter-only objection library for Zendesk Contact Center: clarifying questions, talk tracks, proof, boundaries, next steps and escalation.";

const SECTIONS = [
  { id: "playbook", label: "Playbook" },
  { id: "library", label: "Library" },
  { id: "sources", label: "Sources" },
];

type CopyState = "idle" | "ok" | "err";

function useCopy() {
  const [state, setState] = useState<CopyState>("idle");
  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2400);
    return () => clearTimeout(t);
  }, [state]);
  const copy = useCallback(async (text: string) => {
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(text);
      setState("ok");
    } catch { setState("err"); }
  }, []);
  return { state, copy };
}

function CopyButton({ label, text, testId, announce, icon }: { label: string; text: string; testId: string; announce: string; icon: "copy" | "link" }) {
  const { state, copy } = useCopy();
  const Icon = state === "ok" ? Check : state === "err" ? X : icon === "link" ? Link2 : Copy;
  return (
    <span className="inline-flex items-center">
      <button type="button" onClick={() => copy(text)} className={`oh-btn ${state === "ok" ? "is-ok" : state === "err" ? "is-bad" : icon === "copy" ? "is-lime" : ""}`} data-testid={testId}>
        <Icon className="h-4 w-4" aria-hidden />
        {state === "ok" ? "Copied" : state === "err" ? "Copy failed" : label}
      </button>
      <span role="status" aria-live="polite" className="sr-only">{state === "ok" ? `${announce} copied to clipboard` : state === "err" ? "Could not copy. Select the text manually." : ""}</span>
    </span>
  );
}

function useActiveSection() {
  const [active, setActive] = useState("playbook");
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-30% 0px -60% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}

function Skeleton() {
  return (
    <div className="mt-4 space-y-3" aria-busy="true" aria-label="Loading objection library">
      <div className="oh-skel h-20" />
      <div className="oh-skel h-12" />
      <div className="grid gap-3 lg:grid-cols-[minmax(0,26rem)_1fr]"><div className="oh-skel h-96" /><div className="oh-skel h-96" /></div>
    </div>
  );
}

function SourceLink({ s }: { s: ObjectionSource }) {
  const external = /^https?:\/\//i.test(s.url);
  if (!external) {
    return <span className="oh-tag is-internal" title="Internal reference, not publicly linked" data-testid={`text-source-${s.id}`}><FileText className="h-3 w-3" aria-hidden />{s.title}</span>;
  }
  return (
    <a href={s.url} target="_blank" rel="noopener noreferrer" className="oh-tag is-link" data-testid={`link-source-${s.id}`}>
      {s.title}<ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

function Detail({ o, category, sources, onClose }: { o: ObjectionResponse; category?: ObjectionCategory; sources: Map<string, ObjectionSource>; onClose: () => void }) {
  const reduce = useReducedMotion();
  const link = objectionLink(window.location.origin, import.meta.env.BASE_URL, o.id);
  return (
    <motion.article key={o.id} className="oh-detail" aria-labelledby={`oh-title-${o.id}`} data-testid={`detail-objection-${o.id}`}
      initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: [0.2, 0.7, 0.2, 1] }}>
      <header className="oh-detail-head">
        <div className="flex flex-wrap items-center gap-1.5">
          {category && <span className="oh-tag is-ink">{category.title}</span>}
          <span className={`oh-tag ${o.origin === "foundation" ? "is-foundation" : ""}`} data-testid={`text-origin-${o.id}`}>{o.origin === "foundation" ? "Foundation GTM adaptation" : "Expanded"}</span>
          <button type="button" onClick={onClose} className="oh-close lg:hidden" aria-label="Close response" data-testid="button-close-detail"><X className="h-4 w-4" /></button>
        </div>
        <h3 id={`oh-title-${o.id}`} className="oh-detail-title">{o.title}</h3>
        <p className="oh-concern"><span className="eyebrow">Underlying concern</span>{o.concern}</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton label="Copy response" text={formatResponseForCopy(o, category?.title)} testId="button-copy-response" announce="Response" icon="copy" />
          <CopyButton label="Copy link" text={link} testId="button-copy-link" announce="Link" icon="link" />
        </div>
      </header>

      <div className="oh-step is-ask">
        <span className="oh-step-n">1</span>
        <div><div className="eyebrow">Ask first</div><p data-testid="text-question">{o.question}</p></div>
      </div>
      <div className="oh-step is-talk">
        <span className="oh-step-n">2</span>
        <div><div className="eyebrow">Talk track</div><p className="oh-talk" data-testid="text-response">{o.response}</p></div>
      </div>
      <div className="oh-step">
        <span className="oh-step-n">3</span>
        <div><div className="eyebrow">Proof or demo</div><p data-testid="text-proof">{o.proof}</p></div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="oh-box is-avoid"><div className="eyebrow flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5" aria-hidden />Boundary: do not promise</div><p data-testid="text-avoid">{o.avoid}</p></div>
        <div className="oh-box is-next"><div className="eyebrow flex items-center gap-1.5"><CornerDownRight className="h-3.5 w-3.5" aria-hidden />Next step</div><p data-testid="text-next">{o.nextStep}</p></div>
      </div>
      <div className="oh-box is-esc"><div className="eyebrow flex items-center gap-1.5"><Siren className="h-3.5 w-3.5" aria-hidden />Bring in</div><p data-testid="text-escalation">{o.escalation}</p></div>

      {o.sourceIds.length > 0 && (
        <footer className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="eyebrow mr-1 text-[#11110D]/50">Sources</span>
          {o.sourceIds.map((sid) => { const s = sources.get(sid); return s ? <SourceLink key={sid} s={s} /> : <span key={sid} className="oh-tag">{sid}</span>; })}
        </footer>
      )}
    </motion.article>
  );
}

function Guide({ data }: { data: ObjectionHandlingGuide }) {
  const reduce = useReducedMotion();
  const active = useActiveSection();
  const [categoryId, setCategoryId] = useState<string>(ALL_CATEGORIES);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const ids = useMemo(() => new Set(data.objections.map((o) => o.id)), [data.objections]);
  const catById = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);
  const sources = useMemo(() => new Map(data.sources.map((s) => [s.id, s])), [data.sources]);
  const counts = useMemo(() => countByCategory(data.objections), [data.objections]);
  const foundation = useMemo(() => data.objections.filter((o) => o.origin === "foundation"), [data.objections]);
  const results = useMemo(() => filterObjections(data.objections, data.categories, { categoryId, query }), [data.objections, data.categories, categoryId, query]);
  const selected = selectedId ? data.objections.find((o) => o.id === selectedId) : undefined;
  const selectedHidden = !!selected && !results.some((r) => r.id === selected.id);

  // External hash selection (initial load, back/forward, pasted link): select and clear filters that would hide it.
  const filtersRef = useRef({ categoryId, query });
  filtersRef.current = { categoryId, query };
  useEffect(() => {
    const sync = (scroll: boolean) => {
      const id = objectionIdFromHash(window.location.hash, ids);
      if (!id) {
        if (!SECTIONS.some((s) => `#${s.id}` === window.location.hash)) setSelectedId(null);
        return;
      }
      setSelectedId(id);
      const o = data.objections.find((x) => x.id === id);
      const f = filtersRef.current;
      if (o && filterObjections([o], data.categories, f).length === 0) {
        setCategoryId(ALL_CATEGORIES);
        setQuery("");
        setNotice("Filters cleared to show the linked objection.");
      }
      if (scroll) requestAnimationFrame(() => document.getElementById("library")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }));
    };
    sync(true);
    const onNav = () => sync(true);
    window.addEventListener("hashchange", onNav);
    window.addEventListener("popstate", onNav);
    return () => { window.removeEventListener("hashchange", onNav); window.removeEventListener("popstate", onNav); };
  }, [ids, data.objections, data.categories, reduce]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(t);
  }, [notice]);

  const select = (id: string) => {
    setSelectedId(id);
    if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `${window.location.pathname}${window.location.search}#${encodeURIComponent(id)}`);
    if (window.matchMedia("(max-width: 1023px)").matches) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
  };
  const clearSelection = () => {
    setSelectedId(null);
    window.history.pushState(null, "", `${window.location.pathname}${window.location.search}`);
  };
  const resetFilters = () => { setCategoryId(ALL_CATEGORIES); setQuery(""); };
  const filtered = categoryId !== ALL_CATEGORIES || query.trim() !== "";

  return (
    <>
      <nav className="oh-nav" aria-label="Page sections">
        {SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`} className={active === s.id ? "is-on" : ""} aria-current={active === s.id ? "true" : undefined} data-testid={`link-section-${s.id}`}>{s.label}</a>)}
      </nav>

      <section id="playbook" className="oh-sec">
        <div className="mb-3"><a href="#playbook" className="eyebrow text-[#203524] hover:underline">Playbook</a><h2 className="oh-h2">Answer in four moves</h2></div>
        <ol className="oh-moves">
          {[
            ["Ask", "Clarify what is behind the concern before answering it."],
            ["Answer", "Give the short talk track. Stop. Let them react."],
            ["Prove", "Point to the demo, doc or reference that backs it up."],
            ["Commit", "Agree a next step, respect the boundary, escalate if needed."],
          ].map(([t, d], i) => (
            <li key={t}><span className="mono text-xs text-[#203524]">{String(i + 1).padStart(2, "0")}</span><strong>{t}</strong><span>{d}</span></li>
          ))}
        </ol>
        {foundation.length > 0 && (
          <div className="oh-foundation">
            <div className="eyebrow mb-2 text-[#D1F470]">Start here: foundation objections</div>
            <div className="flex flex-wrap gap-1.5">
              {foundation.map((o) => (
                <a key={o.id} href={`#${o.id}`} onClick={(e) => { e.preventDefault(); resetFilters(); select(o.id); document.getElementById("library")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }}
                  className="oh-fchip" data-testid={`link-foundation-${o.id}`}>{o.title}</a>
              ))}
            </div>
          </div>
        )}
      </section>

      <section id="library" className="oh-sec">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div><a href="#library" className="eyebrow text-[#203524] hover:underline">Library</a><h2 className="oh-h2">Find the objection, use the answer</h2></div>
          <p className="mono text-xs text-[#11110D]/60" aria-live="polite" data-testid="text-result-count">{results.length} of {data.objections.length} shown</p>
        </div>

        <div className="oh-controls">
          <label className="oh-search">
            <Search className="h-4 w-4 text-[#11110D]/50" aria-hidden />
            <span className="sr-only">Search all objection responses</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search every field, e.g. migration, SOC 2, per seat" data-testid="input-objection-search" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" data-testid="button-clear-search"><X className="h-4 w-4" /></button>}
          </label>
          <div className="oh-cats" role="group" aria-label="Filter by category">
            <button type="button" aria-pressed={categoryId === ALL_CATEGORIES} onClick={() => setCategoryId(ALL_CATEGORIES)} className="oh-cat" data-testid="button-category-all">All <span>{data.objections.length}</span></button>
            {data.categories.map((c) => (
              <button key={c.id} type="button" aria-pressed={categoryId === c.id} onClick={() => setCategoryId(c.id)} className="oh-cat" title={c.description} data-testid={`button-category-${c.id}`}>{c.title} <span>{counts[c.id] ?? 0}</span></button>
            ))}
          </div>
          {categoryId !== ALL_CATEGORIES && catById.get(categoryId) && <p className="text-sm text-[#11110D]/65" data-testid="text-category-description">{catById.get(categoryId)?.description}</p>}
          {notice && <p className="oh-notice" role="status">{notice}</p>}
        </div>

        <div className="oh-split">
          <div className="oh-list-wrap">
            {results.length === 0 ? (
              <div className="oh-empty" data-testid="state-no-results">
                <Search className="h-5 w-5 text-[#203524]" aria-hidden />
                <p className="font-semibold">No objection matches {query.trim() ? <>"{query.trim()}"</> : "this filter"}.</p>
                <p className="text-sm text-[#11110D]/60">Try a broader word or another category.</p>
                <button type="button" onClick={resetFilters} className="oh-btn is-ink mt-2" data-testid="button-reset-filters"><RotateCw className="h-4 w-4" aria-hidden />Reset filters</button>
              </div>
            ) : (
              <ul className="oh-list">
                {results.map((o) => {
                  const on = o.id === selectedId;
                  return (
                    <li key={o.id} id={o.id}>
                      <button type="button" onClick={() => (on ? clearSelection() : select(o.id))} aria-pressed={on} className="oh-item" data-testid={`button-objection-${o.id}`}>
                        <span className="oh-item-cat">{catById.get(o.categoryId)?.title ?? o.categoryId}{o.origin === "foundation" && <i aria-label="Foundation"> · Foundation</i>}</span>
                        <span className="oh-item-title">{o.title}</span>
                        <span className="oh-item-concern">{o.concern}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {filtered && results.length > 0 && <button type="button" onClick={resetFilters} className="oh-reset-link" data-testid="button-reset-filters-inline">Reset filters</button>}
          </div>

          <div className="oh-detail-wrap" ref={detailRef}>
            {selected ? (
              <>
                {selectedHidden && (
                  <div className="oh-notice mb-2 flex flex-wrap items-center justify-between gap-2" data-testid="state-selected-hidden">
                    <span>This objection is outside the current filters.</span>
                    <button type="button" onClick={resetFilters} className="underline underline-offset-2" data-testid="button-show-in-list">Show in list</button>
                  </div>
                )}
                <Detail o={selected} category={catById.get(selected.categoryId)} sources={sources} onClose={clearSelection} />
              </>
            ) : (
              <div className="oh-placeholder" data-testid="state-no-selection">
                <div className="eyebrow text-[#203524]">No objection selected</div>
                <p className="mt-2 text-lg font-semibold leading-snug">Pick an objection to open the clarifying question, talk track, proof, boundary, next step and escalation.</p>
                <p className="mt-2 text-sm text-[#11110D]/60">Every response has its own link you can share with your team.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="sources" className="oh-sec">
        <div className="mb-3"><a href="#sources" className="eyebrow text-[#203524] hover:underline">Sources</a><h2 className="oh-h2">Where this comes from</h2></div>
        <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
          <div className="oh-panel space-y-3">
            <div><div className="eyebrow mb-1 text-[#203524]">Provenance</div><p className="text-sm font-semibold" data-testid="text-source-title">{data.sourceTitle}</p><p className="text-sm leading-relaxed text-[#11110D]/70" data-testid="text-source-note">{data.sourceNote}</p></div>
            <div className="oh-coverage"><div className="eyebrow mb-1">Coverage goal</div><p className="text-sm leading-relaxed" data-testid="text-coverage-note">{data.coverageNote}</p><p className="mt-1.5 text-xs text-[#11110D]/55">A breadth target for common conversations, not a measured success rate.</p></div>
            <p className="mono text-xs text-[#11110D]/55" data-testid="text-prepared-on">Prepared {data.preparedOn}</p>
          </div>
          <ul className="oh-panel space-y-3">
            {data.sources.map((s) => (
              <li key={s.id} className="text-sm leading-relaxed">
                <SourceLink s={s} />
                <p className="mt-1 text-[#11110D]/65">{s.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

export default function ObjectionHandlingPage() {
  useCompeteMeta(TITLE, DESC);
  const reduce = useReducedMotion();
  const { isPresenter, auth } = useDepot();
  const enabled = isPresenter && auth.isAuthenticated;
  const q = useGetObjectionHandling({ query: { enabled, queryKey: getGetObjectionHandlingQueryKey(), retry: 1 } });
  const data = enabled && !q.isError ? q.data : undefined;
  const status = (q.error as { status?: number } | null)?.status;
  const authErr = status === 401 || status === 403;

  return (
    <div className="oh">
      <div className="oh-wrap">
        <motion.header className="oh-hero" initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}>
          <Link href="/resources" className="oh-chip mb-3" data-testid="link-back-resources"><ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Resources</Link>
          <div className="eyebrow mb-2 text-[#D1F470]">Presenter resource · Objection handling</div>
          <h1 className="oh-title">Hear the concern. <em>Answer it straight.</em></h1>
          <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-[#F5F5F2]/70">Short, credible responses for live Zendesk Contact Center conversations, with the question to ask, the proof to show and the line not to cross.</p>
          {data && (
            <dl className="oh-stats">
              <div><dt>Objections</dt><dd data-testid="text-stat-objections">{data.objections.length}</dd></div>
              <div><dt>Categories</dt><dd>{data.categories.length}</dd></div>
              <div><dt>Prepared</dt><dd className="text-base">{data.preparedOn}</dd></div>
            </dl>
          )}
        </motion.header>

        {!enabled ? null : q.isLoading || (q.isFetching && !data && !q.isError) ? <Skeleton /> : !data ? (
          <div className="oh-panel mt-4 max-w-2xl" role="alert">
            <AlertTriangle className="h-6 w-6 text-[#a2361f]" aria-hidden />
            <h2 className="mt-2 text-lg font-semibold">{authErr ? "Your session needs to be refreshed." : "The objection library could not be loaded."}</h2>
            <p className="mt-1 text-sm text-[#11110D]/65">{authErr ? "Sign in again from presenter mode, then retry." : "Check your connection and try again."}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {authErr && <button type="button" onClick={auth.login} className="oh-btn is-lime" data-testid="button-objection-signin">Sign in</button>}
              <button type="button" onClick={() => q.refetch()} className="oh-btn is-ink" data-testid="button-objection-retry"><RotateCw className="h-4 w-4" aria-hidden /> Retry</button>
            </div>
          </div>
        ) : <Guide data={data} />}
      </div>
    </div>
  );
}
