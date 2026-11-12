import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle, Building2, CircleSlash, Download, ExternalLink, FileSearch, Globe2, ImageOff,
  Loader2, Lock, LogIn, RefreshCw, RotateCcw, Search, Sparkles, Square, Users,
} from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { resolveResearchCompany, type ResearchCompany, type ResearchReport } from "@workspace/api-client-react";
import { PageHero } from "@/components/kit";
import { ResearchMarkdown } from "@/components/research-markdown";
import { BRIEF_FIELDS, EMPTY_BRIEF_FIELDS, validateBriefFields, type DemoBriefFields } from "@/data/demo-brief-prompt";
import { streamResearchReport, ResearchStreamError } from "@/lib/research-stream";

const TITLE = "Demo Researcher | ZCC Depot";
const DESC = "Research a company from current public sources before a Zendesk Contact Center demo: cited eight-section report, company logo and PDF export.";

function useMeta() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = TITLE;
    const meta = [
      ['meta[name="description"]', DESC], ['meta[property="og:title"]', TITLE], ['meta[property="og:description"]', DESC],
      ['meta[name="twitter:title"]', TITLE], ['meta[name="twitter:description"]', DESC],
    ].map(([sel, content]) => {
      const el = document.querySelector<HTMLMetaElement>(sel);
      const previous = el?.getAttribute("content") ?? "";
      el?.setAttribute("content", content);
      return { el, previous };
    });
    return () => { document.title = prevTitle; meta.forEach(({ el, previous }) => el?.setAttribute("content", previous)); };
  }, []);
}

type Errors = Partial<Record<keyof DemoBriefFields, string>>;
type Lookup =
  | { kind: "idle" }
  | { kind: "loading"; key: string }
  | { kind: "done"; key: string; company: ResearchCompany }
  | { kind: "error"; key: string; msg: string; status?: number };
type Ctx = { fields: DemoBriefFields; company: ResearchCompany | null };
type Report =
  | { kind: "idle" }
  | { kind: "streaming"; ctx: Ctx; status: string; text: string; startedAt: number }
  | { kind: "complete"; ctx: Ctx; report: ResearchReport }
  | { kind: "failed"; ctx: Ctx; text: string; msg: string; status: number | null }
  | { kind: "canceled"; ctx: Ctx; text: string };
type Pdf = { kind: "idle" } | { kind: "busy" } | { kind: "error"; msg: string } | { kind: "warn"; msg: string };

const SECTIONS = ["Executive snapshot", "Company context", "Technology stack", "Support channels", "Zendesk use cases", "Demo flow", "Discovery questions", "Sources"];
const ICONS = { companyName: Building2, companyWebsite: Globe2, region: Search, audience: Users } as const;
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

function errStatus(e: unknown): number | undefined {
  return e && typeof e === "object" && "status" in e && typeof (e as { status: unknown }).status === "number" ? (e as { status: number }).status : undefined;
}
function lookupMsg(e: unknown): string {
  const s = errStatus(e);
  if (s === 401) return "Session expired. Sign in again to look up this company.";
  if (s === 429) return "Lookup limit reached. Wait a moment, or enter the website yourself.";
  if (s === 404 || s === 422) return "Couldn't confidently identify this company. Enter its official website to continue.";
  return "Company lookup failed. Check the name or enter the official website.";
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
async function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
}

export default function DemoBriefPage() {
  useMeta();
  const { isAuthenticated, isLoading: authLoading, login, user } = useAuth();
  const [fields, setFields] = useState<DemoBriefFields>(EMPTY_BRIEF_FIELDS);
  const [errors, setErrors] = useState<Errors>({});
  const [websiteSource, setWebsiteSource] = useState<"user" | "auto" | "none">("none");
  const [lookup, setLookup] = useState<Lookup>({ kind: "idle" });
  const [report, setReport] = useState<Report>({ kind: "idle" });
  const [pdf, setPdf] = useState<Pdf>({ kind: "idle" });
  const [logoFailed, setLogoFailed] = useState(false);

  const lookupSeq = useRef(0);
  const lastLookupKey = useRef("");
  const websiteEditSeq = useRef(0);
  const reportCtrl = useRef<AbortController | null>(null);
  const lookupCtrl = useRef<AbortController | null>(null);
  const reportSeq = useRef(0);
  const resultHeadRef = useRef<HTMLHeadingElement>(null);

  const userWebsite = websiteSource === "user" ? fields.companyWebsite : "";
  const lookupKey = `${norm(fields.companyName)}|${norm(userWebsite)}`;
  const lookupCurrent = lookup.kind !== "idle" && lookup.key === lookupKey;
  const company = lookup.kind === "done" && lookupCurrent ? lookup.company : null;
  const generating = report.kind === "streaming";

  useEffect(() => () => { reportCtrl.current?.abort(); lookupCtrl.current?.abort(); lookupSeq.current++; }, []);

  const cancelReport = useCallback((toIdle: boolean) => {
    reportSeq.current++;
    reportCtrl.current?.abort();
    reportCtrl.current = null;
    setPdf({ kind: "idle" });
    if (toIdle) setReport({ kind: "idle" });
  }, []);

  const runLookup = useCallback(async (force = false) => {
    if (!isAuthenticated) return;
    const name = fields.companyName.trim();
    if (name.length < 2 || name.length > 120) return;
    const site = userWebsite.trim();
    const key = lookupKey;
    if (!force && key === lastLookupKey.current) return;
    lastLookupKey.current = key;
    lookupCtrl.current?.abort();
    const controller = new AbortController();
    lookupCtrl.current = controller;
    const seq = ++lookupSeq.current;
    const editAtStart = websiteEditSeq.current;
    setLookup({ kind: "loading", key });
    setLogoFailed(false);
    try {
      const result = await resolveResearchCompany({ companyName: name, ...(site ? { companyWebsite: site } : {}) }, { signal: controller.signal });
      if (seq !== lookupSeq.current) return;
      setLookup({ kind: "done", key, company: result });
      if (websiteEditSeq.current === editAtStart && !site && result.companyWebsite) {
        setFields((f) => ({ ...f, companyWebsite: result.companyWebsite }));
        setWebsiteSource("auto");
        setErrors((e) => ({ ...e, companyWebsite: undefined }));
      }
    } catch (e) {
      if (seq !== lookupSeq.current) return;
      lastLookupKey.current = "";
      setLookup({ kind: "error", key, msg: lookupMsg(e), status: errStatus(e) });
    }
  }, [isAuthenticated, fields.companyName, userWebsite, lookupKey]);

  const runLookupRef = useRef(runLookup);
  runLookupRef.current = runLookup;

  // Debounced auto lookup on name / user-entered website.
  useEffect(() => {
    if (!isAuthenticated || fields.companyName.trim().length < 2) return;
    const t = setTimeout(() => void runLookupRef.current(), 1100);
    return () => clearTimeout(t);
  }, [lookupKey, isAuthenticated, fields.companyName]);

  const update = (key: keyof DemoBriefFields, value: string) => {
    setFields((f) => {
      const next = { ...f, [key]: value };
      if (key === "companyName" && websiteSource === "auto") next.companyWebsite = "";
      return next;
    });
    if (key === "companyWebsite") { websiteEditSeq.current++; setWebsiteSource(value.trim() ? "user" : "none"); }
    if (key === "companyName" && websiteSource === "auto") setWebsiteSource("none");
    if (key === "companyName" || key === "companyWebsite") { lookupSeq.current++; lookupCtrl.current?.abort(); lastLookupKey.current = ""; setLookup({ kind: "idle" }); setLogoFailed(false); }
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
    if (report.kind !== "idle") cancelReport(true);
  };

  const generate = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || generating) return;
    const v = validateBriefFields(fields);
    if (!v.valid) {
      setErrors(v.errors);
      const first = BRIEF_FIELDS.find((f) => v.errors[f.key]);
      if (first) document.getElementById(`brief-${first.key}`)?.focus();
      return;
    }
    setErrors({});
    cancelReport(false);
    const ctx: Ctx = { fields: v.fields, company: company && !logoFailed ? company : company ? { ...company, logoUrl: null } : null };
    const ctrl = new AbortController();
    reportCtrl.current = ctrl;
    const seq = ++reportSeq.current;
    setReport({ kind: "streaming", ctx, status: "Starting research", text: "", startedAt: Date.now() });
    requestAnimationFrame(() => resultHeadRef.current?.focus());
    let text = "";
    try {
      const done = await streamResearchReport(v.fields, {
        signal: ctrl.signal,
        onEvent: (ev) => {
          if (seq !== reportSeq.current) return;
          if (ev.type === "delta") { text += ev.text; setReport((r) => (r.kind === "streaming" ? { ...r, text } : r)); }
          else if (ev.type === "status") setReport((r) => (r.kind === "streaming" ? { ...r, status: ev.message } : r));
        },
      });
      if (seq !== reportSeq.current) return;
      setReport({ kind: "complete", ctx, report: done });
    } catch (err) {
      if (seq !== reportSeq.current) return;
      if (ctrl.signal.aborted) { setReport({ kind: "canceled", ctx, text }); return; }
      const status = err instanceof ResearchStreamError ? err.status : null;
      const msg = err instanceof Error && err.name !== "TypeError" ? err.message : "Network connection lost while researching. Try again.";
      setReport({ kind: "failed", ctx, text, msg, status });
    } finally {
      if (reportCtrl.current === ctrl) reportCtrl.current = null;
    }
  };

  const cancel = () => {
    reportCtrl.current?.abort();
  };

  const clear = () => {
    cancelReport(true);
    lookupSeq.current++;
    lookupCtrl.current?.abort();
    lastLookupKey.current = "";
    setFields(EMPTY_BRIEF_FIELDS);
    setErrors({});
    setWebsiteSource("none");
    setLookup({ kind: "idle" });
    setLogoFailed(false);
  };

  const exportPdf = async () => {
    if (report.kind !== "complete" || pdf.kind === "busy") return;
    const { report: r, ctx } = report;
    setPdf({ kind: "busy" });
    let logo: string | undefined;
    let warn: string | null = null;
    if (ctx.company?.logoUrl) {
      try {
        const res = await fetch(ctx.company.logoUrl, { credentials: "include" });
        if (!res.ok) throw new Error(String(res.status));
        logo = await blobToDataUrl(await res.blob());
      } catch {
        warn = "The company logo has expired or could not be fetched, so this PDF was exported without it. Re-run the company lookup to include it.";
      }
    }
    try {
      const mod = await import("@/lib/research-pdf");
      const doc = mod.createResearchPdf(r, logo);
      doc.save(mod.researchPdfFilename(r));
      setPdf(warn ? { kind: "warn", msg: warn } : { kind: "idle" });
    } catch (err) {
      setPdf({ kind: "error", msg: err instanceof Error ? `PDF export failed: ${err.message}` : "PDF export failed." });
    }
  };

  const filled = BRIEF_FIELDS.filter((f) => fields[f.key].trim().length >= 2).length;

  return (
    <div className="bg-[#F5F5F2]">
      <PageHero eyebrow="Demos · Live research" title="Demo Researcher"
        lede="Research a company from current public sources and get a cited, eight-section prep report for your Zendesk Contact Center demo." />

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 md:px-8 lg:grid-cols-12">
        <aside className="space-y-5 lg:col-span-4 lg:self-start lg:sticky lg:top-24">
          {authLoading ? (
            <div className="space-y-3 rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8] p-6" aria-busy="true" data-testid="skeleton-auth">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-[#11110D]/[.06]" />)}
            </div>
          ) : !isAuthenticated ? (
            <SignInCard onLogin={login} />
          ) : (
            <form onSubmit={generate} noValidate className="rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8] p-6" data-testid="form-demo-brief" aria-labelledby="brief-form-title">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="brief-form-title" className="text-xl font-semibold tracking-tight text-[#11110D]">Account context</h2>
                <span className="mono text-xs text-[#11110D]/50" data-testid="text-fields-complete">{filled}/4</span>
              </div>

              <LogoPanel lookup={lookup} current={lookupCurrent} company={company} failed={logoFailed} onFail={() => setLogoFailed(true)}
                canRetry={fields.companyName.trim().length >= 2} onRetry={() => void runLookup(true)} />

              <div className="mt-5 space-y-4">
                {BRIEF_FIELDS.map((f) => {
                  const err = errors[f.key];
                  const id = `brief-${f.key}`;
                  const Icon = ICONS[f.key];
                  const isSite = f.key === "companyWebsite";
                  return (
                    <div key={f.key}>
                      <div className="flex items-baseline justify-between gap-2">
                        <label htmlFor={id} className="text-sm font-semibold text-[#11110D]">{f.key === "region" ? "Region" : f.label}</label>
                        {isSite && websiteSource === "auto" && <span className="mono text-[0.65rem] uppercase tracking-wider text-[#203524]/70" data-testid="text-website-auto">auto-filled · edit to correct</span>}
                      </div>
                      <div className="relative mt-1.5">
                        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#11110D]/35" aria-hidden />
                        <input id={id} type={isSite ? "url" : "text"} inputMode={isSite ? "url" : undefined}
                          value={fields[f.key]} placeholder={f.placeholder} maxLength={f.maxLength} required autoComplete="off" disabled={generating}
                          onChange={(e) => update(f.key, e.target.value)}
                          onBlur={() => { if (f.key === "companyName" || isSite) void runLookup(); }}
                          aria-invalid={!!err} aria-describedby={err ? `${id}-error` : undefined} data-testid={`input-${f.key}`}
                          className={`w-full rounded-xl border bg-[#F5F5F2] py-2.5 pl-9 pr-3.5 text-sm text-[#11110D] outline-none transition-colors placeholder:text-[#11110D]/35 focus:border-[#203524] focus:bg-[#FDFDFB] disabled:opacity-60 ${err ? "border-[#9a4b2a]" : "border-[#11110D]/15"}`} />
                      </div>
                      {err && <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs text-[#9a4b2a]" data-testid={`error-${f.key}`}><AlertTriangle className="h-3.5 w-3.5" aria-hidden />{err}</p>}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {generating ? (
                  <button type="button" onClick={cancel} data-testid="button-cancel-research"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#11110D] px-5 py-2.5 text-sm font-semibold text-[#F5F5F2] transition hover:bg-[#2a2a24]">
                    <Square className="h-3.5 w-3.5 fill-current" aria-hidden /> Cancel research
                  </button>
                ) : (
                  <button type="submit" data-testid="button-generate-research"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#203524] px-5 py-2.5 text-sm font-semibold text-[#D1F470] transition hover:-translate-y-0.5 hover:bg-[#2b4630]">
                    <Sparkles className="h-4 w-4" aria-hidden /> {report.kind === "complete" ? "Regenerate report" : "Generate report"}
                  </button>
                )}
                <button type="button" onClick={clear} data-testid="button-reset-brief"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#11110D]/15 px-5 py-2.5 text-sm font-semibold text-[#11110D]/75 transition hover:border-[#203524] hover:text-[#203524]">
                  <RotateCcw className="h-4 w-4" aria-hidden /> Clear
                </button>
              </div>
              <p className="mt-5 border-l-2 border-[#203524]/30 pl-3 text-[0.72rem] leading-relaxed text-[#11110D]/60" data-testid="text-privacy-note">
                Uses public sources only. Your inputs are sent to Gemini through Replit's approved AI integration, and usage is billed to Replit credits. Reports aren't saved on the server; download the PDF to keep one.
                {user?.email && <span className="mt-1 block mono text-[0.65rem] text-[#11110D]/45">Signed in as {user.email}</span>}
              </p>
            </form>
          )}
        </aside>

        <section className="min-w-0 lg:col-span-8" aria-labelledby="brief-output-title">
          <div className="flex min-h-[32rem] flex-col rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8]">
            <ReportArea report={report} headRef={resultHeadRef} pdf={pdf} onExport={() => void exportPdf()}
              onRetry={() => document.getElementById("brief-companyName")?.closest("form")?.requestSubmit()} onLogin={login} signedIn={isAuthenticated} />
          </div>
        </section>
      </div>
    </div>
  );
}

function SignInCard({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="on-dark overflow-hidden rounded-3xl bg-[#203524] p-7 text-[#F5F5F2]" data-testid="card-sign-in">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#D1F470] text-[#203524]"><Lock className="h-5 w-5" aria-hidden /></span>
      <h2 className="mt-5 text-2xl font-semibold leading-tight tracking-tight">Sign in to research accounts</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#F5F5F2]/70">Live research calls Gemini and is billed to Replit credits, so it's limited to signed-in architects. Nothing runs until you sign in and choose Generate.</p>
      <button type="button" onClick={onLogin} data-testid="button-sign-in"
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D1F470] px-5 py-2.5 text-sm font-semibold text-[#11110D] transition hover:-translate-y-0.5 hover:bg-[#c3ea55]">
        <LogIn className="h-4 w-4" aria-hidden /> Sign in with Replit
      </button>
    </div>
  );
}

function LogoPanel({ lookup, current, company, failed, onFail, canRetry, onRetry }: {
  lookup: Lookup; current: boolean; company: ResearchCompany | null; failed: boolean; onFail: () => void; canRetry: boolean; onRetry: () => void;
}) {
  const loading = lookup.kind === "loading" && current;
  const err = lookup.kind === "error" && current ? lookup : null;
  const hasLogo = !!company?.logoUrl && !failed;
  return (
    <div className="mt-4 flex gap-3 rounded-2xl border border-[#11110D]/10 bg-[#F5F5F2] p-3" data-testid="panel-company-lookup" aria-live="polite">
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#11110D]/10 bg-white p-1.5">
        {loading ? <div className="h-full w-full animate-pulse rounded-lg bg-[#11110D]/[.06]" />
          : hasLogo ? <img src={company!.logoUrl!} alt={`${company!.companyName} logo`} onError={onFail} className="h-full w-full object-contain" data-testid="img-company-logo" />
          : <ImageOff className="h-5 w-5 text-[#11110D]/30" aria-hidden />}
      </div>
      <div className="min-w-0 flex-1 text-xs leading-snug">
        {loading ? (
          <p className="flex items-center gap-1.5 pt-1 font-semibold text-[#203524]" data-testid="status-lookup"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Looking up company…</p>
        ) : err ? (
          <>
            <p className="flex items-center gap-1.5 font-semibold text-[#9a4b2a]" data-testid="status-lookup"><AlertTriangle className="h-3.5 w-3.5" aria-hidden />Lookup unavailable</p>
            <p className="mt-1 text-[#11110D]/65">{err.msg}</p>
          </>
        ) : company ? (
          <>
            <p className="truncate font-semibold text-[#11110D]" data-testid="status-lookup">{company.companyName}</p>
            {hasLogo && company.logoSourceUrl ? (
              <a href={company.logoSourceUrl} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[#203524] underline decoration-[#203524]/30 underline-offset-2" data-testid="link-logo-source">
                <span className="truncate">Logo from {(() => { try { return new URL(company.logoSourceUrl).hostname; } catch { return "source"; } })()}</span><ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
              </a>
            ) : (
              <p className="mt-0.5 font-medium text-[#11110D]/70" data-testid="text-logo-unavailable">{failed ? "Logo couldn't be loaded." : "No verified logo found."} Research still works without it.</p>
            )}
            {company.note && <p className="mt-1 text-[#11110D]/55" data-testid="text-lookup-note">{company.note}</p>}
          </>
        ) : (
          <p className="pt-1 text-[#11110D]/55">Enter a company name. We'll find its official website and logo automatically.</p>
        )}
        {(err || company) && canRetry && (
          <button type="button" onClick={onRetry} className="mt-1.5 inline-flex items-center gap-1 font-semibold text-[#203524] hover:underline" data-testid="button-retry-lookup">
            <RefreshCw className="h-3 w-3" aria-hidden /> Look up again
          </button>
        )}
      </div>
    </div>
  );
}

function headings(md: string) {
  return md.split("\n").map((l) => /^##\s+(.*)$/.exec(l.trim())?.[1]).filter((h): h is string => !!h).map((h) => h.replace(/[*_`]/g, ""));
}

function ReportArea({ report, headRef, pdf, onExport, onRetry, onLogin, signedIn }: {
  report: Report; headRef: React.RefObject<HTMLHeadingElement | null>; pdf: Pdf; onExport: () => void; onRetry: () => void; onLogin: () => void; signedIn: boolean;
}) {
  const markdown = report.kind === "complete" ? report.report.markdown : report.kind === "idle" ? "" : report.text;
  const toc = useMemo(() => headings(markdown), [markdown]);

  if (report.kind === "idle") {
    return (
      <div className="flex flex-1 flex-col p-6 md:p-8" data-testid="empty-report">
        <h2 id="brief-output-title" ref={headRef} tabIndex={-1} className="text-xl font-semibold tracking-tight text-[#11110D] outline-none">Research report</h2>
        <div className="mt-6 grid flex-1 place-items-center rounded-2xl border border-dashed border-[#203524]/25 bg-[#F5F5F2] p-8">
          <div className="max-w-md text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#203524] text-[#D1F470]"><FileSearch className="h-5 w-5" aria-hidden /></span>
            <p className="mt-4 text-base font-semibold text-[#11110D]">No report yet</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[#11110D]/60">{signedIn ? "Fill in the account context and choose Generate report. Editing any field clears the previous report so it can't be mistaken for a different account." : "Sign in, then generate a cited report for any account."}</p>
            <ol className="mt-6 grid grid-cols-2 gap-1.5 text-left sm:grid-cols-4">
              {SECTIONS.map((s, i) => (
                <li key={s} className="rounded-lg border border-[#11110D]/10 bg-[#FBFBF8] px-2 py-1.5 text-[0.68rem] leading-tight text-[#11110D]/65">
                  <span className="mono block text-[0.6rem] text-[#203524]">{String(i + 1).padStart(2, "0")}</span>{s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const { ctx } = report;
  const complete = report.kind === "complete";
  const logo = ctx.company?.logoUrl;
  return (
    <>
      <header className="border-b border-[#11110D]/10 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#11110D]/10 bg-white p-2">
              {logo ? <img src={logo} alt={`${ctx.fields.companyName} logo`} className="h-full w-full object-contain" data-testid="img-report-logo" />
                : <span className="text-xl font-semibold text-[#203524]/50" aria-hidden>{ctx.fields.companyName.slice(0, 1).toUpperCase()}</span>}
            </div>
            <div className="min-w-0">
              <p className="eyebrow text-[#203524]">{complete ? "Research report" : report.kind === "streaming" ? "Draft · researching" : "Incomplete draft"}</p>
              <h2 id="brief-output-title" ref={headRef} tabIndex={-1} className="truncate text-2xl font-semibold tracking-tight text-[#11110D] outline-none" data-testid="text-report-company">{ctx.fields.companyName}</h2>
              <a href={ctx.fields.companyWebsite} target="_blank" rel="noopener noreferrer" className="mono block truncate text-xs text-[#11110D]/55 hover:text-[#203524]">{ctx.fields.companyWebsite}</a>
            </div>
          </div>
          {complete && (
            <button type="button" onClick={onExport} disabled={pdf.kind === "busy"} data-testid="button-export-pdf"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D1F470] px-5 py-2.5 text-sm font-semibold text-[#11110D] transition hover:-translate-y-0.5 hover:bg-[#c3ea55] disabled:opacity-60">
              {pdf.kind === "busy" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
              {pdf.kind === "busy" ? "Building PDF…" : "Download PDF"}
            </button>
          )}
        </div>
        <dl className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-[#11110D]/10 bg-[#11110D]/10 text-sm sm:grid-cols-3" data-testid="snapshot-context">
          {[["Region", ctx.fields.region], ["Audience", ctx.fields.audience], ["Researched", complete ? fmtDate(report.report.researchedAt) : "Not complete"]].map(([k, v]) => (
            <div key={k} className="bg-[#F5F5F2] px-4 py-3">
              <dt className="mono text-[0.62rem] uppercase tracking-widest text-[#11110D]/45">{k}</dt>
              <dd className="mt-0.5 font-medium text-[#11110D]">{v}</dd>
            </div>
          ))}
        </dl>
        <div aria-live="polite">
          {pdf.kind === "warn" && <p className="mt-3 flex items-start gap-2 rounded-xl border border-[#b8862b]/30 bg-[#f6efdc] px-3.5 py-2 text-sm text-[#6b4d12]" data-testid="status-pdf-warning"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{pdf.msg}</p>}
          {pdf.kind === "error" && <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-[#9a4b2a]/30 bg-[#f6e9e2] px-3.5 py-2 text-sm text-[#7a3a1f]" data-testid="status-pdf-error"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{pdf.msg}</p>}
        </div>
      </header>

      {report.kind === "streaming" && (
        <div className="flex items-center gap-3 border-b border-[#11110D]/10 bg-[#203524] px-6 py-3 text-sm text-[#F5F5F2] md:px-8" role="status" data-testid="status-research">
          <span className="relative grid h-2.5 w-2.5 place-items-center"><span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-[#D1F470]/70" /><span className="h-2 w-2 rounded-full bg-[#D1F470]" /></span>
          <span className="truncate">{report.status}</span>
          <span className="mono ml-auto shrink-0 text-[0.68rem] text-[#F5F5F2]/55">{report.text.length.toLocaleString()} chars</span>
        </div>
      )}
      {report.kind === "failed" && (
        <div role="alert" className="flex flex-wrap items-start gap-3 border-b border-[#9a4b2a]/20 bg-[#f6e9e2] px-6 py-4 text-sm text-[#7a3a1f] md:px-8" data-testid="status-research-error">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1"><p className="font-semibold">Research didn't finish</p><p className="mt-0.5">{report.msg}{report.text && " The partial draft below is incomplete and can't be exported."}</p></div>
          {report.status === 401 ? (
            <button type="button" onClick={onLogin} className="rounded-full bg-[#7a3a1f] px-4 py-1.5 text-xs font-semibold text-[#F5F5F2]" data-testid="button-error-sign-in">Sign in again</button>
          ) : report.status !== 429 && (
            <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-full bg-[#7a3a1f] px-4 py-1.5 text-xs font-semibold text-[#F5F5F2]" data-testid="button-retry-research"><RefreshCw className="h-3 w-3" aria-hidden />Try again</button>
          )}
        </div>
      )}
      {report.kind === "canceled" && (
        <div className="flex items-center gap-3 border-b border-[#11110D]/10 bg-[#ecebe4] px-6 py-3 text-sm text-[#11110D]/75 md:px-8" data-testid="status-research-canceled">
          <CircleSlash className="h-4 w-4 shrink-0" aria-hidden /> Research canceled. {report.text ? "The draft below is incomplete and not exportable." : "No content was received."}
        </div>
      )}

      <div className="grid flex-1 gap-8 p-6 md:p-8 xl:grid-cols-[1fr_11rem]">
        <article className={`min-w-0 ${complete ? "" : "relative"}`} data-testid="text-report-body">
          {markdown ? (
            <>
              {!complete && <p className="mono mb-4 inline-block rounded-full border border-dashed border-[#11110D]/25 px-3 py-1 text-[0.65rem] uppercase tracking-widest text-[#11110D]/55">Unfinished draft</p>}
              <div className={complete ? "" : "opacity-90"}><ResearchMarkdown markdown={markdown} /></div>
              {report.kind === "streaming" && <span className="mt-2 inline-block h-4 w-2 animate-pulse bg-[#203524]" aria-hidden />}
            </>
          ) : report.kind === "streaming" ? (
            <div className="space-y-3" aria-hidden data-testid="skeleton-report">
              {[72, 94, 88, 60, 0, 40, 92, 85, 78].map((w, i) => w ? <div key={i} className="h-3.5 animate-pulse rounded bg-[#11110D]/[.07]" style={{ width: `${w}%` }} /> : <div key={i} className="h-4" />)}
            </div>
          ) : (
            <p className="text-sm text-[#11110D]/55">No report content was received.</p>
          )}
          {complete && (
            <p className="mt-10 border-l-2 border-[#203524]/30 pl-3 text-xs leading-relaxed text-[#11110D]/55" data-testid="text-report-disclaimer">
              AI-generated from public sources on {fmtDate(report.report.researchedAt)} · {report.report.sources.length} sources. Claims marked Likely or Unknown are unconfirmed. Open each citation and confirm Zendesk capabilities before using this with a customer.
            </p>
          )}
        </article>
        {toc.length > 1 && (
          <nav aria-label="Report sections" className="hidden xl:block">
            <div className="sticky top-28">
              <p className="eyebrow text-[0.6rem] text-[#11110D]/45">Sections</p>
              <ol className="mt-3 space-y-1.5 border-l border-[#11110D]/10">
                {toc.map((h, i) => <li key={`${h}-${i}`} className="-ml-px border-l-2 border-transparent pl-3 text-xs leading-snug text-[#11110D]/65">{h}</li>)}
              </ol>
            </div>
          </nav>
        )}
      </div>
    </>
  );
}
