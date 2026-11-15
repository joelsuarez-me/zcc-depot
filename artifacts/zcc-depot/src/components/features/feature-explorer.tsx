import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ClipboardCheck, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { FEATURE_REGISTRY, filterFeatures, getCategoryCounts } from "@/data/feature-registry";
import { FEATURE_CATEGORIES, FEATURE_CLASSIFICATIONS, type FeatureCategoryId, type FeatureClassification } from "@/data/feature-types";
import { FeatureCard } from "./feature-card";
import { EvidenceChip, FeatureDetail, type Tab } from "./feature-detail";
import { evidenceReviewQueue } from "@/data/feature-evidence";
import { featureHref } from "@/data/feature-registry";
import { consumeEvidenceRequest, onEvidenceRequest } from "@/components/evidence-signal";
import { FeatureIcon } from "./feature-icon";
import "./features.css";

function readParam(): string | null {
  try { return new URLSearchParams(window.location.search).get("feature"); } catch { return null; }
}
function urlFor(id: string | null) {
  const p = new URLSearchParams(window.location.search);
  if (id) p.set("feature", id); else p.delete("feature");
  const qs = p.toString();
  return `${window.location.pathname}${qs ? `?${qs}` : ""}#features`;
}
const known = (id: string | null) => !!id && FEATURE_REGISTRY.some((f) => f.id === id);

export function FeatureExplorer() {
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FeatureCategoryId | "all">("all");
  const [classification, setClassification] = useState<FeatureClassification | "all">("all");
  const [outcome, setOutcome] = useState("all");
  const [demoOnly, setDemoOnly] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [openId, setOpenId] = useState<string | null>(() => { const p = readParam(); return known(p) ? p : null; });
  const [tab, setTab] = useState<Tab>("overview");
  const pushed = useRef(false);
  const opener = useRef<HTMLElement | null>(null);

  const counts = useMemo(() => getCategoryCounts(), []);
  const outcomes = useMemo(() => Array.from(new Set(FEATURE_REGISTRY.map((f) => f.outcome))).sort(), []);
  const list = useMemo(() => filterFeatures(FEATURE_REGISTRY, { query, category, classification, outcome, demoOnly }), [query, category, classification, outcome, demoOnly]);
  const filtered = query !== "" || category !== "all" || classification !== "all" || outcome !== "all" || demoOnly;
  const reset = () => { setQuery(""); setCategory("all"); setClassification("all"); setOutcome("all"); setDemoOnly(false); };

  // Browser back/forward keeps the open feature in sync with ?feature=
  useEffect(() => {
    const onPop = () => { const p = readParam(); pushed.current = false; setOpenId(known(p) ? p : null); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  // Direct link: bring the section into view once.
  useEffect(() => { if (openId) document.getElementById("features")?.scrollIntoView({ block: "start" }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const open = useCallback((id: string, demo = false) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setTab(demo ? "demo" : "overview");
    setOpenId(id);
    if (readParam() !== id) { window.history.pushState(window.history.state, "", urlFor(id)); pushed.current = true; }
  }, []);
  const swap = (id: string) => { setOpenId(id); window.history.replaceState(window.history.state, "", urlFor(id)); };
  const close = () => {
    setOpenId(null);
    if (pushed.current) { pushed.current = false; window.history.back(); }
    else window.history.replaceState(window.history.state, "", urlFor(null));
  };

  const feature = openId ? FEATURE_REGISTRY.find((f) => f.id === openId) ?? null : null;
  const nav = list.some((f) => f.id === openId) ? list : FEATURE_REGISTRY;
  const idx = nav.findIndex((f) => f.id === openId);

  return (
    <div className="fx" data-testid="feature-explorer">
      <div className="mb-4 space-y-3">
        <div className="fx-cats" role="group" aria-label="Filter by category">
          <button type="button" className="fx-cat" aria-pressed={category === "all"} onClick={() => setCategory("all")} data-testid="filter-category-all">All Features<span className="fx-count">{FEATURE_REGISTRY.length}</span></button>
          {FEATURE_CATEGORIES.map((c) => (
            <button key={c.id} type="button" className="fx-cat" aria-pressed={category === c.id} title={c.description} onClick={() => setCategory(c.id)} data-testid={`filter-category-${c.id}`}>
              <FeatureIcon name={c.icon} className="h-3.5 w-3.5" />{c.label}<span className="fx-count">{counts[c.id] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[14rem] flex-1">
            <span className="sr-only">Search features</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#11110D]/45" aria-hidden />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by need, problem, outcome, industry or product" className="fx-input w-full !pl-9" data-testid="input-feature-search" />
          </label>
          <button type="button" className="fx-btn fx-btn-ghost" aria-expanded={showMore} aria-controls="fx-more" onClick={() => setShowMore((v) => !v)} data-testid="button-more-filters"><SlidersHorizontal className="h-4 w-4" aria-hidden />Filters</button>
          {filtered && <button type="button" className="fx-btn fx-btn-ghost" onClick={reset} data-testid="button-reset-filters"><RotateCcw className="h-4 w-4" aria-hidden />Reset</button>}
          <span className="mono ml-auto text-xs text-[#11110D]/55" aria-live="polite" data-testid="text-feature-count">{list.length} of {FEATURE_REGISTRY.length}</span>
        </div>
        {showMore && (
          <div id="fx-more" className="grid gap-2 rounded-2xl border border-[#11110D]/10 bg-[#F5F5F2] p-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="text-xs font-semibold">Classification
              <select className="fx-select mt-1 w-full" value={classification} onChange={(e) => setClassification(e.target.value as FeatureClassification | "all")} data-testid="select-classification">
                <option value="all">All classifications</option>
                {FEATURE_CLASSIFICATIONS.map((c) => <option key={c.value} value={c.value} title={c.description}>{c.value}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold">Outcome
              <select className="fx-select mt-1 w-full" value={outcome} onChange={(e) => setOutcome(e.target.value)} data-testid="select-outcome">
                <option value="all">All outcomes</option>
                {outcomes.map((o) => <option key={o} value={o}>{o.length > 80 ? o.slice(0, 78) + "..." : o}</option>)}
              </select>
            </label>
            <label className="flex min-h-10 items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={demoOnly} onChange={(e) => setDemoOnly(e.target.checked)} className="h-4 w-4 accent-[#203524]" data-testid="checkbox-demo-only" />Dedicated demo available
            </label>
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="fx-empty" data-testid="empty-features">
          <Search className="mx-auto h-6 w-6 text-[#203524]" aria-hidden />
          <p className="mt-2 font-semibold">No capability matches those filters.</p>
          <p className="mt-1 text-sm text-[#11110D]/60">Try a customer problem such as "long hold times" or "verify callers", or clear the filters.</p>
          <button type="button" className="fx-btn fx-btn-ink mt-3" onClick={reset} data-testid="button-empty-reset">Show all features</button>
        </div>
      ) : (
        <motion.div layout={!reduce} className="fx-grid">
          <AnimatePresence initial={false}>
            {list.map((f) => (
              <motion.div key={f.id} layout={!reduce} className="flex" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.22 }}>
                <div className="w-full [&>article]:h-full"><FeatureCard feature={f} onOpen={open} /></div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <EvidenceQueue onOpen={(id) => { open(id); setTab("docs"); }} />

      <FeatureDetail feature={feature} tab={tab} setTab={setTab} onClose={close} onOpenRelated={(id) => { setTab("overview"); swap(id); }}
        onReturnFocus={() => {
          if (opener.current?.isConnected) opener.current.focus();
          else document.querySelector<HTMLInputElement>('[data-testid="input-feature-search"]')?.focus({ preventScroll: true });
        }}
        position={idx >= 0 ? `${idx + 1} of ${nav.length}` : ""}
        onPrev={idx > 0 ? () => swap(nav[idx - 1].id) : undefined}
        onNext={idx >= 0 && idx < nav.length - 1 ? () => swap(nav[idx + 1].id) : undefined} />
    </div>
  );
}

function EvidenceQueue({ onOpen }: { onOpen: (id: string) => void }) {
  const queue = useMemo(() => evidenceReviewQueue(FEATURE_REGISTRY), []);
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const show = () => { const requested = consumeEvidenceRequest(); if ((!requested && window.location.hash !== "#evidence-review") || !ref.current) return; ref.current.open = true; ref.current.scrollIntoView({ block: "start" }); ref.current.querySelector<HTMLElement>("summary")?.focus({ preventScroll: true }); };
    show(); // request made before this page mounted
    return onEvidenceRequest(show);
  }, []);
  const verify = queue.filter((q) => q.feature.evidence.status === "requires-verification").length;
  return (
    <details ref={ref} className="ev-queue" id="evidence-review" data-testid="evidence-queue">
      <summary data-testid="button-toggle-evidence-queue">
        <ClipboardCheck className="h-4 w-4 text-[#203524]" aria-hidden />Evidence review queue
        <span className="mono text-xs font-normal text-[#11110D]/60" data-testid="text-evidence-queue-count">{queue.length} of {FEATURE_REGISTRY.length} need review · {verify} require availability verification</span>
        <span className="ml-auto text-xs font-normal text-[#11110D]/55">Show</span>
      </summary>
      {queue.length === 0 ? <p className="p-4 text-sm">Every feature has current documentation review, an owner and source dates.</p> : (
        <ul>
          {queue.map(({ feature: f, reasons }) => (
            <li key={f.id} className="ev-row" data-testid={`row-evidence-${f.id}`}>
              <div className="min-w-0"><p className="text-sm font-semibold">{f.title}</p><p className="mt-0.5 text-xs text-[#11110D]/55">Owner: {f.evidence.owner ?? "unassigned"}</p></div>
              <div><EvidenceChip status={f.evidence.status} /><div className="mt-1">{reasons.map((r) => <span key={r} className="ev-reason">{r}</span>)}</div></div>
              <a href={featureHref(f.id)} className="fx-btn fx-btn-ghost justify-self-start" onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); onOpen(f.id); } }} data-testid={`link-evidence-open-${f.id}`}>Open evidence</a>
            </li>
          ))}
        </ul>
      )}
      <p className="border-t border-[#11110D]/10 px-4 py-2 text-[0.7rem] text-[#11110D]/55">Review dates reflect documentation checks only, never customer deployment validation. No human approval is recorded in this depot.</p>
    </details>
  );
}
