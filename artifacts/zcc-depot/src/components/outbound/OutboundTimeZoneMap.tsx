import { useId } from "react";
import { US_ZONES, fmtTime, localDate, localToUtc, type TzPolicy } from "@/lib/outbound-time";
import { useMotionPaused } from "./OutboundShared";

const MAINLAND = "M130 62L180 73L230 80L280 82L330 78L370 88L405 83L429 96L448 91L463 110L490 105L509 120L530 111L541 91L556 85L566 66L576 63L586 97L566 133L549 151L534 174L515 181L497 205L482 212L476 246L493 275L488 297L475 292L459 254L442 242L417 240L402 249L375 235L350 238L328 260L302 244L286 220L263 213L240 211L220 199L198 193L174 178L159 160L151 139L135 112Z";
const BANDS = [
  { id: "pt", x: 125, width: 105, lx: 185, ly: 128 },
  { id: "mt", x: 230, width: 105, lx: 278, ly: 160 },
  { id: "ct", x: 335, width: 110, lx: 389, ly: 143 },
  { id: "et", x: 445, width: 150, lx: 501, ly: 154 },
].map((b) => ({ ...b, i: US_ZONES.findIndex((z) => z.id === b.id) }));
const ALASKA = US_ZONES.findIndex((z) => z.id === "ak");
const HAWAII = US_ZONES.findIndex((z) => z.id === "hi");

/** Schematic regional geography; exact eligibility always uses the named IANA zone. */
export function OutboundTimeZoneMap({ policy, selected, onSelect }: {
  policy: TzPolicy;
  selected: string;
  onSelect: (iana: string) => void;
}) {
  const clip = useId().replace(/:/g, "");
  const paused = useMotionPaused();
  const eligible = (iana: string) => {
    const date = localDate(policy.execUtc, iana);
    const restriction = policy.regionRestrict[iana];
    const start = Math.max(policy.windowStart, restriction?.start ?? 0);
    const end = Math.min(policy.windowEnd, restriction?.end ?? 1440);
    return policy.execUtc >= localToUtc(date, start, iana) && policy.execUtc < localToUtc(date, end, iana);
  };
  const attributes = (i: number) => {
    const zone = US_ZONES[i];
    return {
      role: "button" as const,
      tabIndex: 0,
      "aria-label": `${zone.label}: ${fmtTime(policy.execUtc, zone.iana)}. Select regional policy.`,
      "aria-pressed": selected === zone.iana,
      onClick: () => onSelect(zone.iana),
      onKeyDown: (e: React.KeyboardEvent<SVGGElement>) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(zone.iana); }
      },
      className: "ob-map-region",
      "data-testid": `map-zone-${zone.id}`,
    };
  };
  const fill = (i: number) => eligible(US_ZONES[i].iana) ? "#D1F470" : "#35565A";
  return (
    <div className={`rounded-3xl bg-[#0A2427] p-4 text-[#EAF2EC] ${paused ? "ob-still" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <b>Right Customer. Right Local Time.</b>
        <span className="text-xs text-white/70"><span className="inline-block h-2 w-2 rounded-full bg-[#D1F470]" /> Inside recipient window</span>
      </div>
      <svg viewBox="0 0 700 370" role="group" aria-label="Interactive schematic United States time-zone map" className="mt-3 w-full">
        <defs><clipPath id={clip}><path d={MAINLAND} /></clipPath></defs>
        <path d={MAINLAND} transform="translate(0,7)" fill="#031315" />
        <g clipPath={`url(#${clip})`}>
          {BANDS.map((band) => <g key={band.id} {...attributes(band.i)} data-map-region={band.id}>
            <rect x={band.x} y={45} width={band.width} height={265} fill={fill(band.i)} stroke="#0A2427" strokeWidth={2} />
            <rect x={band.x + 3} y={45} width={band.width - 6} height={265} fill="none" stroke={selected === US_ZONES[band.i].iana ? "#FFF" : "transparent"} strokeWidth={4} />
          </g>)}
        </g>
        <path d={MAINLAND} fill="none" stroke="#A8C1B8" strokeWidth={1.5} pointerEvents="none" />
        {BANDS.map((band) => <g key={band.id} transform={`translate(${band.lx},${band.ly})`} pointerEvents="none">
          <rect x={-39} y={-17} width={78} height={40} rx={9} fill="#071A1C" />
          <text textAnchor="middle" y={-2} fill="#F5F5F2" fontSize={13} fontWeight={700}>{US_ZONES[band.i].label}</text>
          <text textAnchor="middle" y={14} fill="#D1F470" fontSize={11}>{fmtTime(policy.execUtc, US_ZONES[band.i].iana)}</text>
        </g>)}
        <g {...attributes(ALASKA)} data-map-region="ak">
          <path d="M65 258L100 240L126 251L135 278L155 296L145 305L126 290L103 302L92 286L68 293L50 282Z" fill={fill(ALASKA)} stroke={selected === US_ZONES[ALASKA].iana ? "white" : "#A8C1B8"} strokeWidth={2} />
          <text x={105} y={328} textAnchor="middle" fill="#F5F5F2" fontSize={13}>Alaska · {fmtTime(policy.execUtc, US_ZONES[ALASKA].iana)}</text>
        </g>
        <g {...attributes(HAWAII)} data-map-region="hi">
          {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={210 + i * 19} cy={287 + i * 5} rx={6 + i} ry={4 + i} fill={fill(HAWAII)} stroke={selected === US_ZONES[HAWAII].iana ? "white" : "#A8C1B8"} strokeWidth={1.5} />)}
          <text x={237} y={344} textAnchor="middle" fill="#F5F5F2" fontSize={13}>Hawaii · {fmtTime(policy.execUtc, US_ZONES[HAWAII].iana)}</text>
        </g>
        <path className="ob-edge is-on" d="M172 43Q360 6 565 43" />
      </svg>
      <p className="text-xs text-white/70">Select a region to edit its policy below. Schematic bands are not state or legal boundaries; Arizona and other exceptions require the recipient’s actual IANA zone. These colors show local-window eligibility only; the table also applies campaign hours, days, holidays and blackouts.</p>
    </div>
  );
}
