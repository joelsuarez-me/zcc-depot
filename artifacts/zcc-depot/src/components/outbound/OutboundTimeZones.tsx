import { useMemo, useState } from "react";
import { TZ_CUSTOMERS, US_ZONES, evaluateTz, fmtMin, fmtTime, isDst, localDate, localToUtc, localToUtcChecked, zoneAbbr, type TzPolicy } from "@/lib/outbound-time";
import { Slider, Tag } from "./OutboundShared";
import { OutboundTimeZoneMap } from "./OutboundTimeZoneMap";

export function OutboundTimeZones() {
  const [date, setDate] = useState("2026-11-17");
  const [execMin, setExecMin] = useState(16 * 60);
  const [ws, setWs] = useState(9 * 60); const [we, setWe] = useState(17 * 60);
  const [campaignStart, setCampaignStart] = useState(8 * 60);
  const [campaignEnd, setCampaignEnd] = useState(22 * 60);
  const [days, setDays] = useState([1, 2, 3, 4, 5]);
  const [blackout, setBlackout] = useState(false);
  const [blackoutStart, setBlackoutStart] = useState(12 * 60);
  const [blackoutEnd, setBlackoutEnd] = useState(13 * 60);
  const [selectedRegion, setSelectedRegion] = useState("America/New_York");
  const [regionRestrict, setRegionRestrict] = useState<TzPolicy["regionRestrict"]>({});
  const [strategy, setStrategy] = useState<"primary" | "all">("all");
  const [holiday, setHoliday] = useState(false);
  const exec = useMemo(() => localToUtcChecked(date, execMin, "America/New_York"), [date, execMin]);
  const policy: TzPolicy = useMemo(() => ({
    dateISO: date, execUtc: exec.utc, windowStart: ws, windowEnd: we, strategy,
    campaignStart, campaignEnd, campaignIana: "America/New_York", days,
    holidays: holiday ? [date] : [],
    blackouts: blackout ? [{ start: localToUtc(date, blackoutStart, "America/New_York"), end: localToUtc(date, blackoutEnd, "America/New_York"), label: "Presenter-defined blackout" }] : [],
    regionRestrict,
  }), [date, exec, ws, we, strategy, holiday, campaignStart, campaignEnd, days, blackout, blackoutStart, blackoutEnd, regionRestrict]);
  const evals = useMemo(() => TZ_CUSTOMERS.map((c) => ({ c, e: evaluateTz(c, policy) })), [policy]);
  const dstProbe = useMemo(() => localToUtcChecked("2026-03-08", 150, "America/New_York"), []);
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr]">
        <label className="ob-field" htmlFor="tz-date"><span>Execution date</span><input id="tz-date" type="date" className="ob-input" value={date} onChange={(e) => { if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value) && Number.isFinite(Date.parse(e.target.value))) setDate(e.target.value); }} data-testid="input-tz-date" /></label>
        <Slider id="tz-exec" label={`Campaign clock · ${fmtMin(execMin)} ET${exec.shifted ? " (DST gap, shifted)" : ""}`} value={execMin} min={0} max={1425} step={15} onChange={setExecMin} />
        <label className="ob-field" htmlFor="tz-strat"><span>Time-zone detection</span><select id="tz-strat" className="ob-input" value={strategy} onChange={(e) => setStrategy(e.target.value as "primary" | "all")} data-testid="select-tz-strategy-lab"><option value="all">All phones and addresses</option><option value="primary">Primary contact only</option></select></label>
        <Slider id="tz-ws" label={`Recipient window start · ${fmtMin(ws)}`} value={ws} min={6 * 60} max={12 * 60} step={30} onChange={setWs} />
        <Slider id="tz-we" label={`Recipient window end · ${fmtMin(we)}`} value={we} min={15 * 60} max={22 * 60} step={30} onChange={setWe} />
        <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" checked={holiday} onChange={(e) => setHoliday(e.target.checked)} data-testid="toggle-tz-holiday" />Treat date as holiday</label>
      </div>
      <OutboundTimeZoneMap policy={policy} selected={selectedRegion} onSelect={setSelectedRegion} />
      <details className="ob-card" open>
        <summary className="cursor-pointer font-semibold">Campaign calendar and regional policies</summary>
        <p className="mt-2 text-xs opacity-70">Illustrative organization policies, not legally sufficient calling rules. Campaign and blackout hours use Eastern time; regional restrictions use the selected recipient zone.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Slider id="tz-campaign-start" label={`Campaign opens · ${fmtMin(campaignStart)} ET`} value={campaignStart} min={0} max={1410} step={30} onChange={setCampaignStart} />
          <Slider id="tz-campaign-end" label={`Campaign closes · ${fmtMin(campaignEnd)} ET`} value={campaignEnd} min={30} max={1440} step={30} onChange={setCampaignEnd} />
          <fieldset className="md:col-span-2"><legend className="mb-2 text-sm font-semibold">Permitted local weekdays</legend><div className="flex flex-wrap gap-3">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => <label key={day} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={days.includes(i)} onChange={(e) => setDays((d) => e.target.checked ? [...d, i] : d.filter((x) => x !== i))} data-testid={`toggle-tz-day-${i}`} />{day}</label>)}
          </div></fieldset>
          <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={blackout} onChange={(e) => setBlackout(e.target.checked)} data-testid="toggle-tz-blackout" />Apply a custom blackout on this execution date</label>
          {blackout && <>
            <Slider id="tz-blackout-start" label={`Blackout begins · ${fmtMin(blackoutStart)} ET`} value={blackoutStart} min={0} max={1410} step={30} onChange={setBlackoutStart} />
            <Slider id="tz-blackout-end" label={`Blackout ends · ${fmtMin(blackoutEnd)} ET`} value={blackoutEnd} min={30} max={1440} step={30} onChange={setBlackoutEnd} />
            {blackoutStart >= blackoutEnd && <p role="alert" className="text-sm text-[#A73222] md:col-span-2">Blackout end must be later than its start. Attempts are excluded until this policy is corrected.</p>}
          </>}
          <label className="ob-field" htmlFor="tz-region"><span>Region policy to edit</span><select id="tz-region" className="ob-input" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} data-testid="select-tz-region">{US_ZONES.map((z) => <option key={z.id} value={z.iana}>{z.label} · {z.iana}</option>)}</select></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!regionRestrict[selectedRegion]} onChange={(e) => setRegionRestrict((r) => { const next = { ...r }; if (e.target.checked) next[selectedRegion] = { start: 10 * 60, end: 16 * 60 }; else delete next[selectedRegion]; return next; })} data-testid="toggle-tz-regional-restriction" />Apply a stricter regional window</label>
          {regionRestrict[selectedRegion] && <>
            <Slider id="tz-regional-start" label={`Regional start · ${fmtMin(regionRestrict[selectedRegion].start)}`} value={regionRestrict[selectedRegion].start} min={0} max={1410} step={30} onChange={(start) => setRegionRestrict((r) => ({ ...r, [selectedRegion]: { ...r[selectedRegion], start } }))} />
            <Slider id="tz-regional-end" label={`Regional end · ${fmtMin(regionRestrict[selectedRegion].end)}`} value={regionRestrict[selectedRegion].end} min={30} max={1440} step={30} onChange={(end) => setRegionRestrict((r) => ({ ...r, [selectedRegion]: { ...r[selectedRegion], end } }))} />
          </>}
        </div>
      </details>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {US_ZONES.map((z) => { const d = localDate(exec.utc, z.iana); const inW = exec.utc >= localToUtc(d, ws, z.iana) && exec.utc < localToUtc(d, we, z.iana);
          return <div key={z.id} className={`ob-tzcell ${inW ? "in" : "out"}`} data-testid={`tz-${z.id}`}><span className="ob-h m-0">{z.label}</span><b className="block text-xl mono">{fmtTime(exec.utc, z.iana)}</b><span className="text-xs">{zoneAbbr(exec.utc, z.iana)} · {isDst(z.iana, exec.utc) ? "DST" : "standard"}</span><span className="block text-xs font-semibold">{inW ? "Inside window" : "Outside window"}</span></div>; })}
      </div>
      <div className="ob-card">
        <span className="ob-h">Multi-contact evaluation · fictional profiles</span>
        <div className="ob-scroll"><table className="ob-table"><thead><tr><th>Customer</th><th>Contacts</th><th>Zones used</th><th>Overlap (ET)</th><th>Status</th><th>Reason</th></tr></thead>
          <tbody>{evals.map(({ c, e }) => <tr key={c.id} data-testid={`row-tz-${c.id}`}><td className="font-semibold">{c.name}</td><td className="text-xs">{c.contacts.map((x) => x.label).join(" · ")}</td><td className="text-xs">{e.zones.join(", ") || "none"}</td><td className="mono text-xs">{e.overlap ? `${fmtTime(e.overlap[0], "America/New_York")}–${fmtTime(e.overlap[1], "America/New_York")}` : "—"}</td>
            <td><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${e.status === "eligible" ? "bg-[#5FB37A]" : e.status === "deferred" ? "bg-[#E8A33D]" : "bg-[#C2412A] text-white"}`} data-testid={`status-tz-${c.id}`}>{e.status}</span></td><td className="text-xs">{e.reason}</td></tr>)}</tbody></table></div>
      </div>
      <p className="text-xs opacity-70"><Tag k="native">Native concept</Tag> Campaigns infer recipient time zones from profile phone numbers and addresses and can require a window that satisfies every detected zone. Since May 18, 2026, multi-contact detection can evaluate all supplied contact zones. With 9 AM–5 PM local windows, Eastern + Pacific overlap at noon–5 PM Eastern; a missing zone or no overlap excludes the attempt. Area codes do not prove actual customer location. DST check: 2:30 AM ET on 2026-03-08 does not exist and resolves to {fmtTime(dstProbe.utc, "America/New_York")} ({dstProbe.shifted ? "shifted forward" : "unchanged"}). Conversions use Intl only; the engine fails closed on invalid windows.</p>
    </div>
  );
}
