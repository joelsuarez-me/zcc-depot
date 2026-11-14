import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { DEFAULT_FILTERS, FILTER_LABEL, MAX_SORT_KEYS, SORT_KEYS, connectionOrder, generateProfiles, runSegment, sortProfiles, validateSort, type Filter, type SortKey } from "@/lib/outbound-segment";
import { useSuppression } from "@/lib/outbound-suppression";
import { Tag } from "./OutboundShared";

const VALUES: Partial<Record<Filter["id"], (string | number)[]>> = {
  renewal: [30, 60, 90, 120, 180], consent: ["voice", "marketing"], window: [8, 9, 10, 12], tier: ["Platinum", "Gold", "Silver", "Standard"],
  region: ["Northeast", "Southeast", "Midwest", "Southwest", "West", "Pacific"], language: ["English", "Spanish", "French", "Vietnamese"],
  stage: ["Onboarding", "Growth", "Renewal", "At risk"], product: ["Auto", "Home", "Life", "Bundle"], lastContact: [7, 14, 30, 60],
};

export function OutboundSegmentation() {
  const profiles = useMemo(() => generateProfiles(), []);
  const sup = useSuppression();
  const [filters, setFilters] = useState<Filter[]>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }[]>([{ key: "renewalDays", dir: "asc" }, { key: "value", dir: "desc" }]);
  const [channel, setChannel] = useState("voice");
  const { steps, result } = useMemo(() => runSegment(profiles, filters, sup), [profiles, filters, sup]);
  const sortErr = validateSort(sort, channel);
  const sorted = useMemo(() => (sortErr ? result : sortProfiles(result, sort)), [result, sort, sortErr]);
  const order = useMemo(() => connectionOrder(sorted.slice(0, 8)), [sorted]);
  const upd = (i: number, p: Partial<Filter>) => setFilters((fs) => fs.map((f, j) => (j === i ? { ...f, ...p } : f)));
  return (
    <div className="grid gap-4 xl:grid-cols-[20rem_1fr]">
      <div className="ob-card grid content-start gap-2">
        <span className="ob-h">Segment criteria · Customer Profiles</span>
        {filters.map((f, i) => (
          <div key={f.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" id={`seg-${f.id}`} checked={f.on} onChange={(e) => upd(i, { on: e.target.checked })} data-testid={`toggle-filter-${f.id}`} />
            <label htmlFor={`seg-${f.id}`} className="flex-1">{FILTER_LABEL[f.id]}</label>
            {VALUES[f.id] && <select aria-label={`${FILTER_LABEL[f.id]} value`} className="ob-input !w-28 !py-1 text-xs" value={String(f.value)} onChange={(e) => upd(i, { value: typeof VALUES[f.id]![0] === "number" ? Number(e.target.value) : e.target.value })} data-testid={`select-filter-${f.id}`}>{VALUES[f.id]!.map((v) => <option key={v} value={v}>{f.id === "window" ? `from ${v}:00` : f.id === "renewal" || f.id === "lastContact" ? `${v} days` : v}</option>)}</select>}
          </div>
        ))}
        <button type="button" className="ob-btn mt-1" onClick={() => setFilters(DEFAULT_FILTERS)} data-testid="button-filters-reset">Reset criteria</button>
        <p className="text-xs opacity-60">"Eligible after suppression" reads the shared suppression center below.</p>
      </div>
      <div className="grid content-start gap-4">
        <div className="ob-card">
          <div className="mb-2 flex items-center gap-2"><span className="ob-h m-0">Audience funnel · 10,000 fictional profiles</span><b className="mono ml-auto text-lg" data-testid="text-segment-count">{result.length.toLocaleString()}</b></div>
          <div className="grid gap-1.5">{steps.map((s) => (
            <div key={s.label} className="ob-funnel-row"><span className="truncate">{s.label}</span><div className="ob-funnel-track"><div className="ob-funnel-fill" style={{ transform: `scaleX(${s.count / 10000})` }} /></div><span className="mono text-right text-xs">{s.count.toLocaleString()}{s.removed ? <small className="block text-[#C2412A]">-{s.removed.toLocaleString()}</small> : null}</span></div>
          ))}</div>
        </div>
        <div className="ob-card grid gap-3">
          <div className="flex flex-wrap items-center gap-2"><span className="ob-h m-0">Sorted segment · up to {MAX_SORT_KEYS} attributes</span>
            <select aria-label="Campaign channel" className="ob-input ml-auto !w-auto !py-1 text-xs" value={channel} onChange={(e) => setChannel(e.target.value)} data-testid="select-sort-channel"><option value="voice">Voice campaign</option><option value="sms">SMS campaign</option><option value="email">Email campaign</option></select></div>
          <div className="flex flex-wrap gap-1.5">{sort.map((k, i) => (
            <span key={k.key} className="ob-step"><i>{i + 1}</i>
              <select aria-label={`Sort key ${i + 1}`} className="bg-transparent" value={k.key} onChange={(e) => setSort((s) => s.map((x, j) => (j === i ? { ...x, key: e.target.value as SortKey } : x)))} data-testid={`select-sort-${i}`}>{SORT_KEYS.filter((x) => x === k.key || !sort.some((y) => y.key === x)).map((x) => <option key={x} value={x}>{x}</option>)}</select>
              <button type="button" aria-label="Toggle direction" onClick={() => setSort((s) => s.map((x, j) => (j === i ? { ...x, dir: x.dir === "asc" ? "desc" : "asc" } : x)))} data-testid={`button-sort-dir-${i}`}>{k.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}</button>
              <button type="button" aria-label="Remove sort key" onClick={() => setSort((s) => s.filter((_, j) => j !== i))} data-testid={`button-sort-remove-${i}`}><X className="h-3 w-3" /></button>
            </span>))}
            <button type="button" className="ob-btn" disabled={sort.length >= SORT_KEYS.length} onClick={() => { const nx = SORT_KEYS.find((x) => !sort.some((y) => y.key === x)); if (nx) setSort((s) => [...s, { key: nx, dir: "asc" }]); }} data-testid="button-sort-add"><Plus className="h-3 w-3" aria-hidden />Add sort</button>
          </div>
          {sortErr && <p className="ob-err" role="alert">{sortErr}</p>}
          <div className="grid gap-3 lg:grid-cols-[1fr_15rem]">
            <div className="ob-scroll"><table className="ob-table"><thead><tr><th>#</th><th>Name</th><th>Tier</th><th>Renewal</th><th>Value</th><th>Region</th><th>Consent</th></tr></thead>
              <tbody>{sorted.slice(0, 8).map((p, i) => <tr key={p.id} data-testid={`row-profile-${p.id}`}><td className="mono">{i + 1}</td><td>{p.name}</td><td>{p.tier}</td><td>{p.renewalDays}d</td><td className="mono">${p.value.toLocaleString()}</td><td>{p.region}</td><td>{p.consent}</td></tr>)}
              {!sorted.length && <tr><td colSpan={7} className="py-6 text-center opacity-60">No profiles match. Loosen a criterion.</td></tr>}</tbody></table></div>
            <div className="rounded-xl bg-[#11110D] p-3 text-[#F5F5F2]"><span className="ob-h text-[#D1F470]">Submission vs connection</span>
              <ul className="grid gap-1 text-xs">{order.map((o) => <li key={o.p.id} className="flex justify-between"><span>#{o.submitted} {o.p.name}</span><span className="mono">{o.connected ? `connects ${o.connected}` : "no answer"}</span></li>)}</ul>
              <p className="mt-2 text-[0.68rem] opacity-70"><Tag k="demo">Illustrative</Tag> Sorting sets submission order; answers decide connection order.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
