import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HOLIDAYS, dayIndex, dayLabel, dayStatus, daySlots, fmt12, isoAt, localSlot, monthLabel, nextOpen, slotStatus, weekday, type Now, type TzId } from "@/lib/callback-engine";

type View = "month" | "week" | "day";
const STATUS_TEXT: Record<string, string> = { open: "Available", past: "Past", closed: "Closed", weekend: "Weekend", holiday: "Holiday", blackout: "Blackout", full: "Full" };

/** Month / week / day scheduling with business-hours, holiday, blackout and capacity validation. */
export function CallbackScheduler({ now, date, slot, tz, onPick }: { now: Now; date: string; slot: number; tz: TzId; onPick: (date: string, slot: number) => void }) {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(date);
  const sel = slotStatus(date, slot, now);
  const loc = localSlot(date, slot, tz);
  const nx = useMemo(() => nextOpen(now), [now]);
  const monthStart = cursor.slice(0, 8) + "01";
  const startIdx = dayIndex(monthStart) - weekday(monthStart);
  const monthDays = Array.from({ length: 42 }, (_, i) => isoAt(startIdx + i));
  const weekStart = dayIndex(cursor) - weekday(cursor);
  const weekDays = Array.from({ length: 7 }, (_, i) => isoAt(weekStart + i));
  const move = (dir: number) => {
    if (view === "month") { const d = new Date(monthStart + "T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() + dir); setCursor(d.toISOString().slice(0, 10)); }
    else setCursor(isoAt(dayIndex(cursor) + dir * (view === "week" ? 7 : 1)));
  };
  const SlotBtn = ({ iso, s }: { iso: string; s: { slot: number; status: string; reason: string } }) => {
    const l = localSlot(iso, s.slot, tz);
    return <button type="button" className={`cb-slot st-${s.status} ${iso === date && s.slot === slot ? "is-sel" : ""}`} title={s.reason} onClick={() => onPick(iso, s.slot)} data-testid={`slot-${iso}-${s.slot}`}>{fmt12(l.min)}<small>{STATUS_TEXT[s.status]}</small></button>;
  };
  return (
    <div className="cb-sched" data-testid="callback-scheduler">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rt-seg cb-seg-light" role="group" aria-label="Calendar view">{(["month", "week", "day"] as View[]).map((v) => <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} data-testid={`button-view-${v}`}>{v[0].toUpperCase() + v.slice(1)}</button>)}</span>
        <button type="button" className="cb-icon" onClick={() => move(-1)} aria-label="Previous" data-testid="button-cal-prev"><ChevronLeft className="h-4 w-4" /></button>
        <strong className="text-sm" data-testid="text-cal-range">{view === "month" ? monthLabel(monthStart) : view === "week" ? `${dayLabel(weekDays[0])} to ${dayLabel(weekDays[6])}` : dayLabel(cursor)}</strong>
        <button type="button" className="cb-icon" onClick={() => move(1)} aria-label="Next" data-testid="button-cal-next"><ChevronRight className="h-4 w-4" /></button>
        <button type="button" className="cb-link" onClick={() => setCursor(now.iso)} data-testid="button-cal-today">Today</button>
        {nx && <button type="button" className="cb-link" onClick={() => { onPick(nx.iso, nx.slot); setCursor(nx.iso); setView("day"); }} data-testid="button-next-available">Next available: {dayLabel(nx.iso)} {fmt12(nx.slot)} ET</button>}
      </div>
      {view === "month" && (
        <div className="cb-month mt-3" role="grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <span key={d} className="cb-dow">{d}</span>)}
          {monthDays.map((iso) => {
            const ds = dayStatus(iso); const open = daySlots(iso, now).filter((s) => s.status === "open").length; const out = iso.slice(0, 7) !== monthStart.slice(0, 7);
            return <button key={iso} type="button" className={`cb-day ds-${ds.status} ${out ? "is-out" : ""} ${iso === date ? "is-sel" : ""} ${iso === now.iso ? "is-now" : ""}`} onClick={() => { setCursor(iso); setView("day"); }} title={HOLIDAYS[iso] ?? ds.note} data-testid={`day-${iso}`}>
              <b>{Number(iso.slice(8))}</b><small>{ds.status === "holiday" ? "Holiday" : ds.status === "weekend" ? "Closed" : open ? `${open} open` : "None"}</small>
            </button>;
          })}
        </div>
      )}
      {view === "week" && (
        <div className="cb-week mt-3">
          {weekDays.map((iso) => <div key={iso} className="cb-wcol"><strong>{dayLabel(iso)}</strong><span className="text-[0.7rem] opacity-60">{dayStatus(iso).note}</span>{dayStatus(iso).status === "open" && daySlots(iso, now).map((s) => <SlotBtn key={s.slot} iso={iso} s={s} />)}</div>)}
        </div>
      )}
      {view === "day" && (
        <div className="mt-3">
          <p className="text-xs opacity-70">{dayStatus(cursor).note}{HOLIDAYS[cursor] ? "" : ""}. Times shown in customer time zone ({tz}).</p>
          {dayStatus(cursor).status === "open" ? <div className="cb-daygrid mt-2">{daySlots(cursor, now).map((s) => <SlotBtn key={s.slot} iso={cursor} s={s} />)}</div> : <p className="cb-closed mt-2">{dayStatus(cursor).note}. Pick another day or use next available.</p>}
        </div>
      )}
      <div className={`cb-valid mt-3 ${sel.status === "open" ? "is-ok" : "is-bad"}`} data-testid="text-slot-validation">
        <strong>{dayLabel(loc.iso)} {fmt12(loc.min)} {tz}</strong> ({dayLabel(date)} {fmt12(slot)} ET): {sel.status === "open" ? "valid, can be booked" : `${sel.reason}. The simulation will reject it and offer the next available window.`}
      </div>
      <p className="mt-1 text-[0.7rem] opacity-55">Simulated now: {dayLabel(now.iso)} {fmt12(now.min)} ET. Hours Mon to Fri 8:00 AM to 6:00 PM ET. Time-zone offsets use this winter demo fixture, not a live appointment service.</p>
    </div>
  );
}
