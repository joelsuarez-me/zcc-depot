import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertTriangle, Check, ClipboardCopy, FileText, RotateCcw, ShieldCheck, Wand2 } from "lucide-react";
import { PageHero } from "@/components/kit";
import {
  BRIEF_FIELDS,
  EMPTY_BRIEF_FIELDS,
  buildDemoBriefPrompt,
  validateBriefFields,
  type DemoBriefFields,
} from "@/data/demo-brief-prompt";

const TITLE = "Demo Researcher | ZCC Depot";
const DESC = "Build a research prompt for a company-specific Zendesk Contact Center demo brief, then run it in Replit Agent with current public web research and cited sources.";

function useMeta() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = TITLE;
    const meta = [
      ['meta[name="description"]', DESC],
      ['meta[property="og:title"]', TITLE],
      ['meta[property="og:description"]', DESC],
      ['meta[name="twitter:title"]', TITLE],
      ['meta[name="twitter:description"]', DESC],
    ].map(([sel, content]) => {
      const el = document.querySelector<HTMLMetaElement>(sel);
      const previous = el?.getAttribute("content") ?? "";
      el?.setAttribute("content", content);
      return { el, previous };
    });
    return () => {
      document.title = prevTitle;
      meta.forEach(({ el, previous }) => el?.setAttribute("content", previous));
    };
  }, []);
}

type Errors = Partial<Record<keyof DemoBriefFields, string>>;
type CopyState = { kind: "idle" } | { kind: "ok" } | { kind: "error"; msg: string };

const STEPS = [
  { t: "Build the prompt", d: "Complete all four fields and select Build prompt. Nothing leaves your browser." },
  { t: "Copy it", d: "Use Copy prompt, or select the full text in the output box manually." },
  { t: "Paste into Replit Agent", d: "Open a Replit Agent chat and paste the entire prompt as one message." },
  { t: "Run current research", d: "Ask Agent to browse public sources now. If it cannot browse, treat output as unverified." },
  { t: "Review citations", d: "Open each numbered source. Confirm company facts and Zendesk claims before the demo." },
];

export default function DemoBriefPage() {
  useMeta();
  const [fields, setFields] = useState<DemoBriefFields>(EMPTY_BRIEF_FIELDS);
  const [errors, setErrors] = useState<Errors>({});
  const [prompt, setPrompt] = useState("");
  const [copy, setCopy] = useState<CopyState>({ kind: "idle" });
  const outRef = useRef<HTMLTextAreaElement>(null);
  const outputHeadRef = useRef<HTMLHeadingElement>(null);

  const update = (key: keyof DemoBriefFields, value: string) => {
    setFields((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
    if (prompt) setPrompt("");
    setCopy({ kind: "idle" });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setCopy({ kind: "idle" });
    const result = validateBriefFields(fields);
    if (!result.valid) {
      setErrors(result.errors);
      setPrompt("");
      const first = BRIEF_FIELDS.find((f) => result.errors[f.key]);
      if (first) document.getElementById(`brief-${first.key}`)?.focus();
      return;
    }
    setErrors({});
    try {
      setPrompt(buildDemoBriefPrompt(fields));
      requestAnimationFrame(() => outputHeadRef.current?.focus());
    } catch (err) {
      setPrompt("");
      setCopy({ kind: "error", msg: err instanceof Error ? err.message : "The prompt could not be built." });
    }
  };

  const reset = () => {
    setFields(EMPTY_BRIEF_FIELDS);
    setErrors({});
    setPrompt("");
    setCopy({ kind: "idle" });
  };

  const selectAll = () => {
    const el = outRef.current;
    if (!el) return;
    el.focus();
    el.select();
  };

  const copyPrompt = async () => {
    if (!prompt) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("unavailable");
      await navigator.clipboard.writeText(prompt);
      setCopy({ kind: "ok" });
    } catch {
      selectAll();
      setCopy({ kind: "error", msg: "Clipboard access was blocked. The prompt is now selected: press Ctrl+C (Cmd+C on Mac) to copy it manually." });
    }
  };

  const filled = BRIEF_FIELDS.filter((f) => fields[f.key].trim().length >= 2).length;

  return (
    <div className="bg-[#F5F5F2]">
      <PageHero eyebrow="Demos · Prompt builder" title="Demo Researcher"
        lede="Builds a research prompt locally. It does not browse, generate facts, save, or send your inputs anywhere.">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F5F5F2]/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#F5F5F2]">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Local only
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D1F470] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#11110D]">
          <FileText className="h-3.5 w-3.5" aria-hidden /> Run in Replit Agent
        </span>
      </PageHero>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 md:px-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <form onSubmit={submit} noValidate className="rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8] p-6" data-testid="form-demo-brief" aria-labelledby="brief-form-title">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="brief-form-title" className="text-xl font-semibold tracking-tight text-[#11110D]">Account context</h2>
              <span className="mono text-xs text-[#11110D]/50" data-testid="text-fields-complete">{filled}/4 complete</span>
            </div>
            <p className="mt-1 text-sm text-[#11110D]/60">All fields are required.</p>
            <div className="mt-5 space-y-4">
              {BRIEF_FIELDS.map((f) => {
                const err = errors[f.key];
                const len = fields[f.key].length;
                const id = `brief-${f.key}`;
                return (
                  <div key={f.key}>
                    <div className="flex items-baseline justify-between gap-2">
                      <label htmlFor={id} className="text-sm font-semibold text-[#11110D]">{f.label}</label>
                      <span className={`mono text-[0.68rem] ${len > f.maxLength ? "text-[#9a4b2a]" : "text-[#11110D]/40"}`} aria-hidden>{len}/{f.maxLength}</span>
                    </div>
                    <input id={id} type={f.key === "companyWebsite" ? "url" : "text"} inputMode={f.key === "companyWebsite" ? "url" : undefined}
                      value={fields[f.key]} placeholder={f.placeholder} maxLength={f.maxLength} required autoComplete="off"
                      onChange={(e) => update(f.key, e.target.value)}
                      aria-invalid={!!err} aria-describedby={err ? `${id}-error` : undefined}
                      data-testid={`input-${f.key}`}
                      className={`mt-1.5 w-full rounded-xl border bg-[#F5F5F2] px-3.5 py-2.5 text-sm text-[#11110D] placeholder:text-[#11110D]/35 outline-none transition-colors focus:border-[#203524] focus:bg-white/60 ${err ? "border-[#9a4b2a]" : "border-[#11110D]/15"}`} />
                    {err && <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs text-[#9a4b2a]" data-testid={`error-${f.key}`}><AlertTriangle className="h-3.5 w-3.5" aria-hidden />{err}</p>}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="submit" data-testid="button-build-prompt"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#203524] px-5 py-2.5 text-sm font-semibold text-[#D1F470] transition hover:bg-[#2b4630]">
                <Wand2 className="h-4 w-4" aria-hidden /> Build prompt
              </button>
              <button type="button" onClick={reset} data-testid="button-reset-brief"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#11110D]/15 px-5 py-2.5 text-sm font-semibold text-[#11110D]/75 transition hover:border-[#203524] hover:text-[#203524]">
                <RotateCcw className="h-4 w-4" aria-hidden /> Clear
              </button>
            </div>
          </form>

          <section aria-labelledby="brief-steps" className="rounded-3xl bg-[#203524] p-6 text-[#F5F5F2] on-dark">
            <h2 id="brief-steps" className="eyebrow text-[#D1F470]">How to use it</h2>
            <ol className="mt-4 space-y-3.5">
              {STEPS.map((s, i) => (
                <li key={s.t} className="flex gap-3">
                  <span className="mono mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#D1F470] text-[0.68rem] font-semibold text-[#11110D]">{i + 1}</span>
                  <div><p className="text-sm font-semibold">{s.t}</p><p className="text-sm leading-snug text-[#F5F5F2]/70">{s.d}</p></div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="lg:col-span-7" aria-labelledby="brief-output-title">
          <div className="flex h-full flex-col rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="brief-output-title" ref={outputHeadRef} tabIndex={-1} className="text-xl font-semibold tracking-tight text-[#11110D] outline-none">Research prompt</h2>
              {prompt && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={selectAll} data-testid="button-select-prompt"
                    className="inline-flex items-center gap-2 rounded-full border border-[#11110D]/15 px-4 py-2 text-xs font-semibold text-[#11110D]/75 transition hover:border-[#203524] hover:text-[#203524]">
                    Select all
                  </button>
                  <button type="button" onClick={copyPrompt} data-testid="button-copy-prompt"
                    className="inline-flex items-center gap-2 rounded-full bg-[#D1F470] px-4 py-2 text-xs font-semibold text-[#11110D] transition hover:bg-[#c3ea55]">
                    {copy.kind === "ok" ? <Check className="h-3.5 w-3.5" aria-hidden /> : <ClipboardCopy className="h-3.5 w-3.5" aria-hidden />}
                    {copy.kind === "ok" ? "Copied" : "Copy prompt"}
                  </button>
                </div>
              )}
            </div>

            <div aria-live="polite" role="status" className="min-h-0" data-testid="status-copy">
              {copy.kind === "ok" && <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#e9f1cf] px-3.5 py-2 text-sm text-[#203524]"><Check className="h-4 w-4" aria-hidden />Prompt copied. Paste it into Replit Agent as a single message.</p>}
            </div>
            <div aria-live="assertive" data-testid="status-copy-error">
              {copy.kind === "error" && <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-[#9a4b2a]/30 bg-[#f6e9e2] px-3.5 py-2 text-sm text-[#7a3a1f]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{copy.msg}</p>}
            </div>

            {prompt ? (
              <>
                <label htmlFor="brief-output" className="sr-only">Generated research prompt</label>
                <textarea id="brief-output" ref={outRef} readOnly value={prompt} spellCheck={false} data-testid="text-prompt-output"
                  className="mono mt-4 min-h-[28rem] w-full flex-1 resize-y rounded-2xl border border-[#11110D]/10 bg-[#F5F5F2] p-4 text-[0.78rem] leading-relaxed text-[#11110D]/85 outline-none focus:border-[#203524]" />
                <p className="mono mt-2 text-[0.68rem] text-[#11110D]/45" data-testid="text-prompt-length">{prompt.length.toLocaleString()} characters · built locally</p>
              </>
            ) : (
              <div className="mt-4 grid flex-1 place-items-center rounded-2xl border border-dashed border-[#203524]/25 bg-[#F5F5F2] p-8 text-center" data-testid="empty-prompt">
                <div className="max-w-sm">
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#203524] text-[#D1F470]"><FileText className="h-5 w-5" aria-hidden /></span>
                  <p className="mt-4 text-base font-semibold text-[#11110D]">No prompt yet</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#11110D]/60">Complete the account context and select Build prompt. Editing any field clears the previous prompt so you never copy stale context.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <p className="mx-auto max-w-7xl border-l-2 border-[#203524]/30 px-5 pb-10 pl-4 text-xs leading-relaxed text-[#11110D]/60 md:mx-8 xl:mx-auto" data-testid="text-brief-disclaimer">
        This page only assembles a prompt in your browser. It does not browse the web, call an AI provider, or produce researched facts, and nothing you enter is saved or sent by this page. Any brief you create comes from running the prompt elsewhere; verify every cited source and Zendesk capability claim before using it with a customer.
      </p>
    </div>
  );
}
