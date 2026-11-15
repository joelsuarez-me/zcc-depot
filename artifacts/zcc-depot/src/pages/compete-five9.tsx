import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Check, Copy, ExternalLink, HelpCircle, Plus, RotateCw, Search, ShieldAlert, X } from "lucide-react";
import { useGetCompeteBattlecard, getGetCompeteBattlecardQueryKey } from "@workspace/api-client-react";
import type { CompeteBattlecard } from "@workspace/api-client-react";
import { useDepot } from "@/lib/depot-mode";
import { CompeteArt, FIVE9_LOGO, useCompeteMeta } from "@/components/compete/compete-kit";
import { CompeteBriefActions } from "@/components/compete/compete-brief-actions";
import "@/styles/compete.css";

const TITLE = "Zendesk vs Five9 | ZCC Depot Compete";
const DESC = "Presenter-only Five9 battlecard: differentiators, objections, discovery questions and dated sources for Zendesk Contact Center.";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "differentiators", label: "Differentiators" },
  { id: "objections", label: "Objections" },
  { id: "discovery", label: "Discovery" },
  { id: "sources", label: "Sources" },
];

function useActiveSection() {
  const [active, setActive] = useState("overview");
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
    }, { rootMargin: "-30% 0px -60% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
  return active;
}

function Skeleton() {
  return (
    <div className="mt-4 space-y-3" aria-busy="true" aria-label="Loading battlecard">
      <div className="cmp-skel h-24" />
      <div className="grid gap-3 md:grid-cols-[15rem_1fr]"><div className="cmp-skel h-56" /><div className="cmp-skel h-56" /></div>
      <div className="cmp-skel h-32" />
    </div>
  );
}

function CopyPitch({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2400);
    return () => clearTimeout(t);
  }, [state]);
  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(text);
      setState("ok");
    } catch { setState("err"); }
  };
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={copy} className={`cmp-btn ${state === "ok" ? "ok" : state === "err" ? "bad" : "lime"}`} data-testid="button-copy-pitch">
        {state === "ok" ? <Check className="h-4 w-4" aria-hidden /> : state === "err" ? <X className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        {state === "ok" ? "Copied" : state === "err" ? "Copy failed" : "Copy pitch"}
      </button>
      <span role="status" aria-live="polite" className="sr-only">{state === "ok" ? "Pitch copied to clipboard" : state === "err" ? "Could not copy. Select the text manually." : ""}</span>
    </span>
  );
}

function QuickFind({ data, onTheme, onObjection }: { data: CompeteBattlecard; onTheme: (id: string) => void; onObjection: (id: string) => void }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const t = data.themes.filter((x) => [x.title, x.zendesk, x.five9, x.question, x.proof].join(" ").toLowerCase().includes(s)).map((x) => ({ kind: "Theme", id: x.id, label: x.title }));
    const o = data.objections.filter((x) => [x.question, x.response, x.proof].join(" ").toLowerCase().includes(s)).map((x) => ({ kind: "Objection", id: x.id, label: x.question }));
    return [...t, ...o];
  }, [q, data]);
  return (
    <div>
      <label className="cmp-search">
        <Search className="h-4 w-4 text-[#11110D]/50" aria-hidden />
        <span className="sr-only">Search themes and objections</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a theme or objection, e.g. AI, pricing" data-testid="input-compete-search" />
        {q && <button type="button" onClick={() => setQ("")} aria-label="Clear search" data-testid="button-clear-search"><X className="h-4 w-4" /></button>}
      </label>
      {q && (
        <div className="cmp-results" role="list" aria-live="polite">
          {results.length ? results.map((r) => (
            <button key={r.kind + r.id} type="button" role="listitem" data-testid={`button-result-${r.id}`}
              onClick={() => { (r.kind === "Theme" ? onTheme : onObjection)(r.id); setQ(""); }}>
              <span className="cmp-tag">{r.kind}</span><span>{r.label}</span>
            </button>
          )) : <p className="px-2 py-1 text-sm text-[#11110D]/55">No match. Try a broader word.</p>}
        </div>
      )}
    </div>
  );
}

function Head({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <div className="mb-3">
      <a href={`#${id}`} className="eyebrow text-[#203524] hover:underline">{eyebrow}</a>
      <h2 className="cmp-h2">{title}</h2>
    </div>
  );
}

function Battlecard({ data }: { data: CompeteBattlecard }) {
  const reduce = useReducedMotion();
  const [themeId, setThemeId] = useState(data.themes[0]?.id ?? "");
  const [open, setOpen] = useState<string | null>(null);
  const active = useActiveSection();
  const theme = data.themes.find((t) => t.id === themeId) ?? data.themes[0];
  const sourceById = useMemo(() => new Map(data.sources.map((s) => [s.id, s])), [data.sources]);

  const goTheme = (id: string) => { setThemeId(id); document.getElementById("differentiators")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); };
  const goObj = (id: string) => { setOpen(id); document.getElementById(`obj-${id}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); };

  return (
    <>
      <nav className="cmp-nav" aria-label="Battlecard sections">
        {SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`} className={active === s.id ? "is-on" : ""} aria-current={active === s.id ? "true" : undefined} data-testid={`link-section-${s.id}`}>{s.label}</a>)}
      </nav>

      <section id="overview" className="cmp-sec">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3">
            <div className="cmp-pitch">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="eyebrow text-[#D1F470]">The resolution pitch</span>
                <CopyPitch text={data.pitch} />
              </div>
              <p className="mt-3 text-lg leading-relaxed md:text-xl" data-testid="text-pitch">{data.pitch}</p>
            </div>
            <p className="text-[0.95rem] leading-relaxed text-[#11110D]/75" data-testid="text-summary">{data.summary}</p>
            <QuickFind data={data} onTheme={goTheme} onObjection={goObj} />
          </div>
          <div className="cmp-panel">
            <div className="eyebrow mb-2 text-[#4a63e8]">Respect the rival: where {data.name} is strong</div>
            <ul className="space-y-2">
              {data.strengths.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed" data-testid={`text-strength-${i}`}>
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4a63e8]" aria-hidden />{s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="differentiators" className="cmp-sec">
        <Head id="differentiators" eyebrow="Differentiators" title="Pick the theme the customer cares about" />
        <div className="cmp-themes">
          <div className="cmp-tabs" role="tablist" aria-label="Themes">
            {data.themes.map((t, i) => (
              <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={t.id === theme?.id} aria-controls="theme-panel"
                onClick={() => setThemeId(t.id)} className="cmp-tab" data-testid={`tab-theme-${t.id}`}>
                <span className="cmp-tab-n">{String(i + 1).padStart(2, "0")}</span>{t.title}
              </button>
            ))}
          </div>
          {theme && (
            <AnimatePresence mode="wait">
              <motion.div key={theme.id} id="theme-panel" role="tabpanel" aria-labelledby={`tab-${theme.id}`} className="cmp-panel space-y-3"
                initial={reduce ? false : { opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -10 }} transition={{ duration: 0.28 }}>
                <h3 className="text-xl font-semibold tracking-tight" data-testid="text-theme-title">{theme.title}</h3>
                <div className="cmp-duel">
                  <div className="cmp-side zd"><div className="eyebrow mb-1.5">Zendesk</div><p data-testid="text-theme-zendesk">{theme.zendesk}</p></div>
                  <div className="cmp-side rv"><div className="eyebrow mb-1.5">{data.name}</div><p data-testid="text-theme-five9">{theme.five9}</p></div>
                </div>
                <div className="cmp-q"><div className="eyebrow mb-1 text-[#D1F470]">Ask this</div><p data-testid="text-theme-question">{theme.question}</p></div>
                <div><div className="eyebrow mb-1 text-[#203524]">Proof</div><p className="text-sm leading-relaxed text-[#11110D]/80" data-testid="text-theme-proof">{theme.proof}</p></div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="cmp-tag">{theme.sourcePages}</span>
                  {theme.sourceIds.map((sid) => {
                    const s = sourceById.get(sid);
                    return s ? <a key={sid} href={s.url} target="_blank" rel="noopener noreferrer" className="cmp-tag" data-testid={`link-theme-source-${sid}`}>{s.title}<ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only">(opens in a new tab)</span></a> : <span key={sid} className="cmp-tag">{sid}</span>;
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      <section id="objections" className="cmp-sec">
        <Head id="objections" eyebrow="Objections" title="When they push back" />
        <div className="space-y-2">
          {data.objections.map((o) => {
            const isOpen = open === o.id;
            return (
              <div key={o.id} id={`obj-${o.id}`} className={`cmp-obj ${isOpen ? "is-open" : ""}`}>
                <button type="button" aria-expanded={isOpen} aria-controls={`obj-body-${o.id}`} onClick={() => setOpen(isOpen ? null : o.id)} data-testid={`button-objection-${o.id}`}>
                  <HelpCircle className="h-4 w-4 shrink-0 text-[#4a63e8]" aria-hidden />
                  <span className="flex-1">{o.question}</span>
                  <Plus className="chev h-4 w-4 shrink-0" aria-hidden />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div id={`obj-body-${o.id}`} initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduce ? undefined : { height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="space-y-2 px-4 pb-4 pl-11">
                        <p className="text-[0.95rem] leading-relaxed" data-testid={`text-objection-response-${o.id}`}>{o.response}</p>
                        <p className="text-sm leading-relaxed text-[#11110D]/65"><span className="eyebrow mr-2 text-[#203524]">Proof</span>{o.proof}</p>
                        <span className="cmp-tag">pp. {o.sourcePages}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      <section id="discovery" className="cmp-sec">
        <Head id="discovery" eyebrow="Discovery" title="Questions that open the gap" />
        <ol className="grid gap-2 md:grid-cols-2">
          {data.themes.map((t, i) => (
            <li key={t.id}>
              <button type="button" onClick={() => goTheme(t.id)} className="cmp-panel flex h-full w-full gap-3 text-left transition hover:border-[#11110D]" data-testid={`button-discovery-${t.id}`}>
                <span className="mono text-xs font-semibold text-[#203524]">{String(i + 1).padStart(2, "0")}</span>
                <span><span className="eyebrow block text-[#11110D]/50">{t.title}</span><span className="text-sm leading-relaxed">{t.question}</span></span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section id="sources" className="cmp-sec">
        <Head id="sources" eyebrow="Sources and guardrails" title="Say it accurately" />
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="cmp-panel border-[#a2361f]/30">
            <div className="eyebrow mb-2 flex items-center gap-2 text-[#a2361f]"><ShieldAlert className="h-4 w-4" aria-hidden /> Guardrails</div>
            <ul className="space-y-2">
              {data.guardrails.map((g, i) => <li key={i} className="flex gap-2.5 text-sm leading-relaxed" data-testid={`text-guardrail-${i}`}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a2361f]" aria-hidden />{g}</li>)}
            </ul>
          </div>
          <div className="cmp-panel">
            <div className="eyebrow mb-1 text-[#203524]">Sources</div>
            <p className="mb-3 text-xs text-[#11110D]/60" data-testid="text-source-meta">{data.sourceTitle} · {data.sourceDates} · Prepared {data.preparedOn}</p>
            <ul className="space-y-2.5">
              {data.sources.map((s) => (
                <li key={s.id} className="text-sm leading-relaxed">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold underline-offset-2 hover:underline" data-testid={`link-source-${s.id}`}>
                    {s.title}<ExternalLink className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">(opens in a new tab)</span>
                  </a>
                  <p className="text-[#11110D]/65">{s.note}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

export default function CompeteFive9Page() {
  useCompeteMeta(TITLE, DESC);
  const reduce = useReducedMotion();
  const { isPresenter, auth } = useDepot();
  const enabled = isPresenter && auth.isAuthenticated;
  const q = useGetCompeteBattlecard("five9", { query: { enabled, queryKey: getGetCompeteBattlecardQueryKey("five9"), retry: 1 } });
  const data = enabled && !q.isError ? q.data : undefined;
  const status = (q.error as { status?: number } | null)?.status;

  return (
    <div className="cmp">
      <div className="cmp-wrap">
        <motion.header className="cmp-hero" initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}>
          <div>
            <Link href="/resources/compete" className="cmp-chip mb-3 hover:border-[#D1F470] hover:text-[#D1F470]" data-testid="link-back-compete"><ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All battlecards</Link>
            <div className="mb-3 flex items-center gap-3">
              <span className="eyebrow text-[#D1F470]">Zendesk vs</span>
              <span className="rounded-lg bg-[#F5F5F2] px-2.5 py-1.5"><img src={FIVE9_LOGO} alt="Five9 logo" className="h-5 w-auto" /></span>
            </div>
            <h1 className="cmp-title" data-testid="text-headline">{data?.headline ?? "Five9 battlecard"}</h1>
            {data && <p className="mt-3 text-xs text-[#F5F5F2]/55 mono">Sources {data.sourceDates} · Prepared {data.preparedOn}</p>}
            {data && <CompeteBriefActions data={data} />}
          </div>
          <CompeteArt />
        </motion.header>

        {!enabled ? null : q.isLoading || (q.isFetching && !data && !q.isError) ? <Skeleton /> : !data ? (
          <div className="cmp-panel mt-4 max-w-2xl" role="alert">
            <AlertTriangle className="h-6 w-6 text-[#a2361f]" aria-hidden />
            <h2 className="mt-2 text-lg font-semibold">{status === 401 || status === 403 ? "Your session needs to be refreshed." : "The battlecard could not be loaded."}</h2>
            <p className="mt-1 text-sm text-[#11110D]/65">{status === 401 || status === 403 ? "Sign in again from presenter mode, then retry." : "Check your connection and try again."}</p>
            {(status === 401 || status === 403) && <button type="button" onClick={auth.login} className="cmp-btn lime mt-4 mr-2" data-testid="button-compete-signin">Sign in</button>}
            <button type="button" onClick={() => q.refetch()} className="cmp-btn ink mt-4" data-testid="button-compete-retry"><RotateCw className="h-4 w-4" aria-hidden /> Retry</button>
          </div>
        ) : <Battlecard data={data} />}
      </div>
    </div>
  );
}
