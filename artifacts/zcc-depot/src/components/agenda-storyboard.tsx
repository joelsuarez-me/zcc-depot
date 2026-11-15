import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ClipboardCopy, Download, Eye, FileInput, Plus, Trash2 } from "lucide-react";
import { FEATURE_REGISTRY } from "@/data/feature-registry";
import { DEMO_NUGGETS } from "@/data/demo-nuggets";
import { INDUSTRIES, USE_CASES } from "@/data/verticals";
import "./demo-readiness.css";

type Kind = "feature" | "demo" | "usecase";
type Step = { key: string; kind: Kind; id: string; title: string; talking: string; caveat: string; href: string; group?: string };
type Story = { audience: string; challenges: string; duration: string; steps: Step[]; privateNotes: string };
const EMPTY: Story = { audience: "", challenges: "", duration: "45", steps: [], privateNotes: "" };

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const CATALOG: Record<Kind, Omit<Step, "key" | "kind">[]> = {
  feature: FEATURE_REGISTRY.map((f) => ({ id: f.id, title: f.title, talking: f.outcome, caveat: f.evidence.availabilityQualification || f.availability, href: `${BASE}/?feature=${encodeURIComponent(f.id)}#features` })),
  demo: DEMO_NUGGETS.map((n) => ({ id: n.id, title: n.title, talking: n.description, caveat: "Simulation with fictional data; no live systems are contacted.", href: `${BASE}/demos/nuggets#${n.id}` })),
  usecase: USE_CASES.map((u) => {
    const ind = INDUSTRIES.find((i) => i.id === u.industryId);
    const custom = u.solution.filter((x) => x.kind !== "Zendesk capability").map((x) => x.kind);
    return {
      id: u.id, group: ind?.name ?? u.industryId, title: `${ind?.name ?? u.industryId} · ${u.title}`, talking: u.challenge,
      caveat: [ind?.qualification, custom.length ? `Depends on: ${Array.from(new Set(custom)).join(", ")}; validate before committing.` : ""].filter(Boolean).join(" "),
      href: `${BASE}/sales/use-cases-by-vertical?industry=${encodeURIComponent(u.industryId)}&case=${encodeURIComponent(u.id)}`,
    };
  }),
};
const abs = (href: string) => (typeof window === "undefined" ? href : `${window.location.origin}${href}`);
const KIND_LABEL: Record<Kind, string> = { feature: "Feature", demo: "Demo", usecase: "Industry use case" };

export function composeStory(s: Story, opts: { customerSafe: boolean; includeCustomer: boolean; company: string }) {
  const lines: string[] = [];
  const showCustomer = !opts.customerSafe || opts.includeCustomer;
  if (showCustomer && opts.company.trim()) lines.push(`Customer: ${opts.company.trim()}`);
  if (s.audience.trim()) lines.push(`Audience: ${s.audience.trim()}`);
  if (s.duration.trim()) lines.push(`Duration: ${s.duration.trim()} minutes`);
  if (showCustomer && s.challenges.trim()) lines.push("", "Challenges to address:", s.challenges.trim());
  if (s.steps.length) {
    lines.push("", "Storyboard:");
    s.steps.forEach((st, i) => {
      lines.push(`${i + 1}. ${KIND_LABEL[st.kind]} · ${st.title}`);
      if (st.talking.trim()) lines.push(`   Talking point: ${st.talking.trim()}`);
      lines.push(`   Open in depot: ${abs(st.href)}`);
    });
    const caveats = Array.from(new Set(s.steps.map((st) => st.caveat.trim()).filter(Boolean)));
    if (caveats.length) { lines.push("", "Caveats:"); caveats.forEach((c) => lines.push(`- ${c}`)); }
  }
  if (!opts.customerSafe && s.privateNotes.trim()) lines.push("", "Private presenter notes:", s.privateNotes.trim());
  return lines.join("\n");
}

export function AgendaStoryboard({ company, problems, onApply, onDirtyChange }: { company: string; problems: string; onApply: (text: string) => boolean; onDirtyChange: (dirty: boolean) => void }) {
  const [story, setStory] = useState<Story>(() => ({ ...EMPTY, challenges: problems }));
  const initial = useRef(JSON.stringify({ ...EMPTY, challenges: problems }));
  const [kind, setKind] = useState<Kind>("feature");
  const [pick, setPick] = useState("");
  const [preview, setPreview] = useState(false);
  const [includeCustomer, setIncludeCustomer] = useState(false);
  const [msg, setMsg] = useState("");
  const [reviewed, setReviewed] = useState<string | null>(null);
  const dirty = JSON.stringify(story) !== initial.current;
  const dirtyRef = useRef(onDirtyChange); dirtyRef.current = onDirtyChange;
  useEffect(() => { dirtyRef.current(dirty); }, [dirty]);
  useEffect(() => () => dirtyRef.current(false), []);

  const set = (p: Partial<Story>) => { setStory((s) => ({ ...s, ...p })); setMsg(""); };
  const options = CATALOG[kind].filter((o) => !story.steps.some((s) => s.kind === kind && s.id === o.id));
  const add = () => {
    const o = CATALOG[kind].find((x) => x.id === pick); if (!o) return;
    set({ steps: [...story.steps, { key: `${kind}:${o.id}`, kind, ...o }] }); setPick("");
  };
  const move = (i: number, d: number) => { const a = [...story.steps]; const [x] = a.splice(i, 1); a.splice(i + d, 0, x); set({ steps: a }); };
  const edit = (i: number, p: Partial<Step>) => set({ steps: story.steps.map((s, j) => (j === i ? { ...s, ...p } : s)) });
  const safeText = useMemo(() => composeStory(story, { customerSafe: true, includeCustomer, company }), [story, includeCustomer, company]);
  const exportReady = preview && reviewed === safeText && !!safeText;

  const apply = () => {
    const text = composeStory(story, { customerSafe: true, includeCustomer: true, company: "" });
    if (onApply(text)) { initial.current = JSON.stringify(story); setStory({ ...story }); setMsg("Storyboard composed into Today’s conversation. Select Save agenda to keep it."); }
  };
  const copy = async () => { if (!exportReady) return; try { await navigator.clipboard.writeText(safeText); setMsg("Customer-safe storyboard copied."); } catch { setMsg("Copy was blocked by the browser. Select the preview text and copy it manually."); } };
  const download = () => {
    if (!exportReady) return;
    const url = URL.createObjectURL(new Blob([safeText], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "demo-storyboard.txt"; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000); setMsg("Customer-safe storyboard downloaded.");
  };

  return (
    <section className="sb" aria-labelledby="sb-heading" data-testid="agenda-storyboard">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow text-[#728075]">Demo storyboard · not saved until applied</div>
          <h2 id="sb-heading" className="mt-1 text-2xl font-semibold tracking-tight text-[#203a2c]">Sequence the demo</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#6c786e]">Order features, demos and industry scenarios with talking points and caveats. It lives only on this page until you compose it into the agenda; nothing is stored in the browser or the URL.</p>
        </div>
        {dirty && <span className="mono rounded-full bg-[#F6EFDD] px-3 py-1 text-[10px] tracking-wider text-[#5a4410]" data-testid="status-storyboard-dirty">UNAPPLIED CHANGES</span>}
      </div>

      <div className="sb-grid mt-5">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
            <label className="text-sm font-semibold text-[#304c38]">Audience<input className="sb-input mt-1" value={story.audience} onChange={(e) => set({ audience: e.target.value })} placeholder="e.g. CX operations leaders, IT architecture" maxLength={300} data-testid="input-storyboard-audience" /></label>
            <label className="text-sm font-semibold text-[#304c38]">Minutes<input className="sb-input mt-1" inputMode="numeric" value={story.duration} onChange={(e) => set({ duration: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) })} data-testid="input-storyboard-duration" /></label>
          </div>
          <label className="block text-sm font-semibold text-[#304c38]">Challenges<span className="font-normal text-[#6c786e]"> · customer context, omitted from customer-safe export unless included</span>
            <textarea className="sb-input mt-1 resize-y" rows={3} value={story.challenges} onChange={(e) => set({ challenges: e.target.value })} maxLength={3000} data-testid="input-storyboard-challenges" /></label>

          <div className="rounded-xl border border-[#d9ddd2] bg-[#fffefa] p-3">
            <div className="grid gap-2 sm:grid-cols-[8rem_1fr_auto]">
              <select className="sb-input" value={kind} onChange={(e) => { setKind(e.target.value as Kind); setPick(""); }} aria-label="Step type" data-testid="select-storyboard-kind">
                <option value="feature">Feature</option><option value="demo">Demo</option><option value="usecase">Industry use case</option>
              </select>
              <select className="sb-input" value={pick} onChange={(e) => setPick(e.target.value)} aria-label={`Choose ${KIND_LABEL[kind].toLowerCase()}`} data-testid="select-storyboard-item">
                <option value="">Choose a {KIND_LABEL[kind].toLowerCase()}…</option>
                {kind === "usecase"
                  ? INDUSTRIES.map((i) => { const g = options.filter((o) => o.group === i.name); return g.length > 0 && <optgroup key={i.id} label={i.name}>{g.map((o) => <option key={o.id} value={o.id}>{o.title.replace(`${i.name} · `, "")}</option>)}</optgroup>; })
                  : options.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
              <button type="button" onClick={add} disabled={!pick} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-[#244b39] px-4 text-sm font-semibold text-[#f5f5eb] disabled:opacity-50" data-testid="button-storyboard-add"><Plus className="h-4 w-4" aria-hidden />Add step</button>
            </div>
          </div>

          {story.steps.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#aeb9aa] p-4 text-sm text-[#68756a]" data-testid="empty-storyboard">No steps yet. Add a feature, demo or industry scenario to begin the sequence.</p>
          ) : (
            <ol className="space-y-2" data-testid="list-storyboard-steps">
              {story.steps.map((st, i) => (
                <li key={st.key} className="sb-step" data-testid={`row-storyboard-${st.key}`}>
                  <div className="sb-step-head">
                    <span className="room-index">{i + 1}</span><span className="sb-kind">{KIND_LABEL[st.kind]}</span>
                    <a href={st.href} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate font-semibold text-[#203a2c] underline-offset-2 hover:underline" data-testid={`link-storyboard-step-${st.key}`}>{st.title}<span className="sr-only"> (opens in a new tab)</span></a>
                    <button type="button" className="sb-ibtn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${st.title} up`}><ArrowUp className="h-4 w-4" aria-hidden /></button>
                    <button type="button" className="sb-ibtn" onClick={() => move(i, 1)} disabled={i === story.steps.length - 1} aria-label={`Move ${st.title} down`}><ArrowDown className="h-4 w-4" aria-hidden /></button>
                    <button type="button" className="sb-ibtn" onClick={() => set({ steps: story.steps.filter((_, j) => j !== i) })} aria-label={`Remove ${st.title}`} data-testid={`button-storyboard-remove-${st.key}`}><Trash2 className="h-4 w-4" aria-hidden /></button>
                  </div>
                  <label className="text-xs font-semibold text-[#536157]">Talking point<textarea className="sb-input mt-1 resize-y" rows={2} value={st.talking} onChange={(e) => edit(i, { talking: e.target.value })} maxLength={1000} /></label>
                  <label className="text-xs font-semibold text-[#536157]">Caveat (from registry, editable)<textarea className="sb-input mt-1 resize-y" rows={2} value={st.caveat} onChange={(e) => edit(i, { caveat: e.target.value })} maxLength={1000} /></label>
                </li>
              ))}
            </ol>
          )}
          <label className="block text-sm font-semibold text-[#304c38]">Private presenter notes<span className="font-normal text-[#6c786e]"> · never exported or applied</span>
            <textarea className="sb-input mt-1 resize-y" rows={3} value={story.privateNotes} onChange={(e) => set({ privateNotes: e.target.value })} maxLength={3000} data-testid="input-storyboard-private" /></label>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setPreview((v) => !v)} aria-pressed={preview} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#cbd1c5] bg-[#fffefa] px-4 text-sm font-semibold text-[#294735]" data-testid="button-storyboard-preview"><Eye className="h-4 w-4" aria-hidden />{preview ? "Hide" : "Show"} customer-safe preview</button>
            <label className="inline-flex min-h-11 items-center gap-2 text-sm text-[#304c38]"><input type="checkbox" checked={includeCustomer} onChange={(e) => setIncludeCustomer(e.target.checked)} className="h-4 w-4 accent-[#244b39]" data-testid="checkbox-storyboard-include-customer" />Include customer name and challenges</label>
          </div>
          {preview && <pre className="sb-preview" aria-label="Customer-safe preview" data-testid="text-storyboard-preview">{safeText || "Nothing to preview yet."}</pre>}
          <p className="rounded-lg border border-[#c9a65a]/50 bg-[#F6EFDD] p-3 text-xs leading-relaxed text-[#5a4410]" data-testid="notice-storyboard-review">
            Customer-safe export removes private notes{includeCustomer ? "" : ", the customer name and challenges"}. Audience, talking points and caveats are your own edits and can still contain sensitive details. Read the preview in full before you copy or download it.
          </p>
          <label className="inline-flex min-h-11 items-center gap-2 text-sm text-[#304c38]">
            <input type="checkbox" disabled={!preview || !safeText} checked={exportReady} onChange={(e) => setReviewed(e.target.checked ? safeText : null)} className="h-4 w-4 accent-[#244b39]" data-testid="checkbox-storyboard-reviewed" />
            I reviewed this preview and it is safe to share{!preview && " (open the preview first)"}
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void copy()} disabled={!exportReady} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#cbd1c5] bg-[#fffefa] px-4 text-sm font-semibold text-[#294735] disabled:opacity-50" data-testid="button-storyboard-copy"><ClipboardCopy className="h-4 w-4" aria-hidden />Copy customer-safe text</button>
            <button type="button" onClick={download} disabled={!exportReady} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#cbd1c5] bg-[#fffefa] px-4 text-sm font-semibold text-[#294735] disabled:opacity-50" data-testid="button-storyboard-download"><Download className="h-4 w-4" aria-hidden />Download customer-safe .txt</button>
            <button type="button" onClick={apply} disabled={story.steps.length === 0} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#244b39] px-4 text-sm font-semibold text-[#f5f5eb] disabled:opacity-50" data-testid="button-storyboard-apply"><FileInput className="h-4 w-4" aria-hidden />Compose into agenda</button>
          </div>
          <div className="rounded-lg bg-[#fffefa] p-3 text-xs leading-relaxed text-[#536157]" data-testid="text-storyboard-pdf-route">
            <p className="font-semibold text-[#294735]">Need a PDF?</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4"><li>Compose into agenda: steps, talking points, links and caveats go into Today’s conversation (unsaved; private notes never included).</li><li>Save agenda.</li><li>Use the agenda’s existing PDF action. It is an internal agenda document; review it before sharing.</li></ol>
          </div>
          {msg && <p role="status" className="rounded-lg bg-[#fffefa] p-3 text-sm text-[#294735]" data-testid="status-storyboard">{msg}</p>}
        </div>
      </div>
    </section>
  );
}
