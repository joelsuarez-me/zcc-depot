import type { ReactNode } from "react";
import { BookOpen, CalendarCheck, Compass, FileText, Globe2, HelpCircle, Layers, LayoutDashboard, Lock, Map, MessagesSquare, Newspaper, Phone, PlayCircle, Search, Sparkles, Target, Users, Workflow, type LucideIcon } from "lucide-react";
import "./art.css";

const L = "#D1F470", F = "#203524", I = "#11110D", P = "#F5F5F2", W = "#FBFBF8";

function Svg({ vb, className = "", children }: { vb: string; className?: string; children: ReactNode }) {
  return <svg viewBox={vb} className={`zart ${className}`} aria-hidden="true" focusable="false" fill="none">{children}</svg>;
}

/** Headset + AI spark node, the reference's central agent mark. */
function AgentNode({ x, y, r = 16 }: { x: number; y: number; r?: number }) {
  const s = r / 16;
  return (
    <g>
      <circle className="halo" cx={x} cy={y} r={r * 1.7} fill={L} opacity=".45" />
      <circle className="pop d1" cx={x} cy={y} r={r} fill={I} stroke={L} strokeOpacity=".5" strokeWidth="2" />
      <g transform={`translate(${x - 8 * s} ${y - 8 * s}) scale(${s})`} stroke={P} strokeWidth="1.6" strokeLinecap="round" className="pop d2">
        <path d="M3 10V8a5 5 0 0 1 10 0v2" /><rect x="2" y="9.5" width="3" height="4" rx="1.2" fill={P} /><rect x="11" y="9.5" width="3" height="4" rx="1.2" fill={P} />
        <path d="M13 13.5c0 1.4-1.4 2-3 2" />
      </g>
      <path className="pop d3" d={`M${x + r * .55} ${y - r * 1.05}l1.6 3.4 3.4 1.6-3.4 1.6-1.6 3.4-1.6-3.4-3.4-1.6 3.4-1.6z`} fill={L} />
    </g>
  );
}

function Check({ x, y, r = 7, cls = "pop d4" }: { x: number; y: number; r?: number; cls?: string }) {
  return (
    <g className={cls}>
      <circle cx={x} cy={y} r={r} fill={L} />
      <path d={`M${x - r * .45} ${y}l${r * .32} ${r * .34} ${r * .6}-${r * .7}`} stroke={F} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Panel({ x, y, w, h = 18, cls, lines = 2 }: { x: number; y: number; w: number; h?: number; cls: string; lines?: number }) {
  return (
    <g className={cls}>
      <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx={(h + 6) / 2} fill={L} opacity=".22" />
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={W} />
      {Array.from({ length: lines }).map((_, i) => (
        <rect key={i} x={x + h * .9} y={y + 5 + i * 5} width={(w - h * 1.6) * (i ? .55 : .9)} height="2.4" rx="1.2" fill={i ? L : F} opacity={i ? 1 : .5} />
      ))}
    </g>
  );
}

export type Motif = "flow" | "map" | "lanes" | "doc" | "rooms" | "search" | "gate" | "brief" | "agenda" | "lost";

/** Compact hero illustration — fixed small height so heroes stay tight. */
export function HeroArt({ motif = "flow", className = "" }: { motif?: Motif; className?: string }) {
  const cls = `zart-hero ${className}`;
  switch (motif) {
    case "map":
      return (
        <Svg vb="0 0 220 84" className={cls}>
          <rect className="rise d1" x="6" y="18" width="78" height="48" rx="14" stroke={L} strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="3 4" />
          <rect className="rise d2" x="136" y="18" width="78" height="48" rx="14" stroke={L} strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="3 4" />
          <path className="draw" d="M84 42h52" stroke={L} strokeWidth="2" />
          <AgentNode x={110} y={42} r={12} />
          {[[28, 34], [56, 50], [160, 34], [190, 50]].map(([a, b], i) => <rect key={i} className={`pop d${i + 2}`} x={a - 10} y={b - 6} width="20" height="12" rx="6" fill={i % 2 ? L : W} />)}
        </Svg>
      );
    case "lanes":
    case "gate":
      return (
        <Svg vb="0 0 220 84" className={cls}>
          {[0, 1, 2].map((i) => <g key={i} className={`rise d${i + 1}`}><rect x={14 + i * 64} y={16} width="54" height="56" rx="12" fill={i === 1 ? W : i === 2 ? L : "none"} stroke={L} strokeOpacity=".55" strokeWidth="1.5" /><rect x={24 + i * 64} y={30} width="34" height="3" rx="1.5" fill={i === 0 ? L : F} opacity=".7" /><rect x={24 + i * 64} y={40} width="22" height="3" rx="1.5" fill={i === 0 ? P : F} opacity=".35" /></g>)}
          {motif === "gate"
            ? <g className="pop d4"><circle cx="196" cy="18" r="13" fill={I} stroke={L} strokeWidth="1.5" /><rect x="190" y="17" width="12" height="9" rx="2" fill={L} /><path d="M192.5 17v-3a3.5 3.5 0 0 1 7 0v3" stroke={L} strokeWidth="1.6" /></g>
            : <Check x={196} y={18} r={9} />}
        </Svg>
      );
    case "doc":
      return (
        <Svg vb="0 0 220 84" className={cls}>
          <g className="rise d1"><rect x="62" y="6" width="64" height="74" rx="10" fill={W} /><rect x="72" y="18" width="40" height="4" rx="2" fill={F} /><rect x="72" y="28" width="44" height="3" rx="1.5" fill={F} opacity=".3" /><rect x="72" y="36" width="34" height="3" rx="1.5" fill={F} opacity=".3" /><rect x="72" y="48" width="30" height="6" rx="3" fill={L} /></g>
          <path className="draw" d="M126 42h30" stroke={L} strokeWidth="2" />
          <Panel x={150} y={32} w={60} cls="rise d3" />
          <Check x={120} y={70} r={9} />
          <AgentNode x={30} y={42} r={13} />
        </Svg>
      );
    case "rooms":
      return (
        <Svg vb="0 0 220 84" className={cls}>
          <path className="draw" d="M14 60 C44 20, 70 70, 100 40 S160 20, 206 34" stroke={L} strokeWidth="2" />
          {[[14, 60], [44, 38], [72, 56], [100, 40], [130, 30], [160, 32], [206, 34]].map(([x, y], i) => <circle key={i} className={`pop d${Math.min(5, i + 1)}`} cx={x} cy={y} r={i === 6 ? 8 : 5} fill={i === 6 ? L : W} stroke={F} strokeWidth="1.5" />)}
        </Svg>
      );
    case "search":
      return (
        <Svg vb="0 0 220 84" className={cls}>
          {[0, 1, 2].map((i) => <g key={i} className={`rise d${i + 1}`}><rect x={20 + i * 14} y={12 + i * 10} width="96" height="22" rx="11" fill={i === 2 ? W : "none"} stroke={L} strokeOpacity=".5" strokeWidth="1.5" /></g>)}
          <g className="pop d4"><circle cx="160" cy="38" r="20" stroke={L} strokeWidth="3" /><path d="M174 52l18 18" stroke={L} strokeWidth="4" strokeLinecap="round" /></g>
          <Check x={160} y={38} r={8} cls="pop d5" />
        </Svg>
      );
    case "brief":
      return (
        <Svg vb="0 0 220 84" className={cls}>
          <Panel x={70} y={8} w={130} cls="rise d1" />
          <Panel x={70} y={33} w={110} cls="rise d2" />
          <Panel x={70} y={58} w={90} cls="rise d3" />
          <path className="draw" d="M42 42 V20 H64 M42 42 V70 H64" stroke={L} strokeWidth="1.5" />
          <AgentNode x={34} y={42} r={13} />
        </Svg>
      );
    case "agenda":
      return (
        <Svg vb="0 0 220 84" className={cls}>
          <g className="rise d1"><rect x="40" y="8" width="140" height="70" rx="14" fill={W} /><rect x="40" y="8" width="140" height="16" rx="8" fill={L} /></g>
          {[0, 1, 2].map((i) => <g key={i} className={`rise d${i + 2}`}><rect x="68" y={34 + i * 13} width={90 - i * 18} height="4" rx="2" fill={F} opacity=".45" /></g>)}
          {[0, 1, 2].map((i) => <Check key={i} x={56} y={36 + i * 13} r={5} cls={`pop d${i + 3}`} />)}
        </Svg>
      );
    case "lost":
      return (
        <Svg vb="0 0 220 84" className={cls}>
          <path className="draw" d="M20 60 H80 C100 60 100 24 120 24 H150" stroke={L} strokeWidth="2" />
          <path className="draw" d="M150 24 l14 14 M164 24 l-14 14" stroke={L} strokeWidth="2.5" strokeLinecap="round" />
          <AgentNode x={20} y={60} r={11} />
          <Panel x={160} y={52} w={50} cls="rise d4" lines={1} />
        </Svg>
      );
    default:
      return (
        <Svg vb="0 0 220 84" className={cls}>
          <path className="draw" d="M34 26 V10 H70 M34 58 V74 H70" stroke={L} strokeWidth="1.5" />
          <Panel x={72} y={2} w={120} cls="rise d2" />
          <Panel x={72} y={33} w={140} cls="rise d3" />
          <Panel x={72} y={64} w={100} cls="rise d4" lines={1} />
          <Check x={84} y={42} r={6} cls="pop d5" />
          <AgentNode x={34} y={42} r={14} />
        </Svg>
      );
  }
}

/** Illustrations for the three home pillars. */
export function PillarArt({ index }: { index: number }) {
  const cls = "zart-hover h-24 w-auto";
  if (index === 0) return (
    <Svg vb="0 0 160 96" className={cls}>
      <circle cx="80" cy="48" r="38" fill={L} opacity=".35" />
      {[[30, 22], [130, 22], [30, 74], [130, 74]].map(([x, y], i) => <g key={i}><path className="draw" d={`M${x} ${y} L80 48`} stroke={F} strokeWidth="1.4" /><rect className={`pop d${i + 1}`} x={x - 14} y={y - 8} width="28" height="16" rx="8" fill={W} stroke={F} strokeOpacity=".25" /></g>)}
      <circle className="hl-node" cx="80" cy="48" r="14" fill={F} /><circle cx="80" cy="48" r="5" fill={L} />
    </Svg>
  );
  if (index === 1) return (
    <Svg vb="0 0 160 96" className={cls}>
      <Panel x={8} y={12} w={96} h={22} cls="rise d1" />
      <Panel x={56} y={44} w={96} h={22} cls="rise d2" />
      <path className="draw" d="M30 34 V56 H56" stroke={F} strokeWidth="1.4" />
      <Check x={140} y={20} r={10} />
      <rect className="hl-node" x="20" y="76" width="44" height="10" rx="5" fill={F} opacity=".15" />
    </Svg>
  );
  return (
    <Svg vb="0 0 160 96" className={cls}>
      <path className="rise d1" d="M80 8 L124 22 V48 C124 72 104 86 80 92 C56 86 36 72 36 48 V22 Z" fill={W} stroke={F} strokeOpacity=".3" strokeWidth="1.5" />
      <path className="hl-node" d="M80 20 L112 30 V48 C112 66 98 76 80 80 Z" fill={L} opacity=".7" />
      <Check x={80} y={50} r={13} cls="pop d3" />
    </Svg>
  );
}

/** Motif per pricing lane (keyed by public method id only — no pricing data). */
export function LaneArt({ id, dark = false }: { id: string; dark?: boolean }) {
  const stroke = dark ? L : F;
  const cls = "zart-hover h-20 w-auto";
  if (id === "bundle") return (
    <Svg vb="0 0 140 80" className={cls}>
      {[0, 1, 2].map((i) => <rect key={i} className={`rise d${i + 1}`} x={30 + i * 6} y={50 - i * 16} width="72" height="20" rx="10" fill={i === 2 ? L : "none"} stroke={stroke} strokeOpacity=".6" strokeWidth="1.5" />)}
      <AgentNode x={118} y={22} r={10} />
    </Svg>
  );
  if (id === "byoa") return (
    <Svg vb="0 0 140 80" className={cls}>
      <path className="rise d1" d="M24 54a14 14 0 0 1 4-27 20 20 0 0 1 38-4 14 14 0 0 1 10 27z" fill="none" stroke={stroke} strokeOpacity=".55" strokeWidth="1.5" />
      <path className="draw" d="M76 44 H104" stroke={stroke} strokeWidth="1.6" />
      <rect className="pop d3 hl-node" x="104" y="32" width="28" height="24" rx="12" fill={W} stroke={stroke} strokeOpacity=".4" />
      <Check x={118} y={44} r={6} cls="pop d4" />
    </Svg>
  );
  return (
    <Svg vb="0 0 140 80" className={cls}>
      {[[40, 30], [70, 22], [100, 30]].map(([x, y], i) => <g key={i} className={`pop d${i + 1}`}><circle cx={x} cy={y} r="10" fill={i === 1 ? F : W} stroke={F} strokeOpacity=".4" /><path d={`M${x - 16} ${y + 34} a16 14 0 0 1 32 0`} fill={i === 1 ? F : W} stroke={F} strokeOpacity=".4" /></g>)}
      <path className="draw" d="M20 72 H120" stroke={F} strokeWidth="1.4" />
    </Svg>
  );
}

/** Small decorative illustration for empty / error / sign-in states. */
export function StateArt({ kind }: { kind: "lock" | "error" | "empty" }) {
  return (
    <Svg vb="0 0 120 72" className="h-16 w-auto">
      <Panel x={30} y={8} w={84} cls="rise d1" />
      <Panel x={30} y={40} w={64} cls="rise d2" lines={1} />
      {kind === "lock"
        ? <g className="pop d3"><circle cx="18" cy="36" r="14" fill={I} /><rect x="12" y="35" width="12" height="9" rx="2" fill={L} /><path d="M14.5 35v-3a3.5 3.5 0 0 1 7 0v3" stroke={L} strokeWidth="1.6" /></g>
        : kind === "error"
          ? <g className="pop d3"><circle cx="18" cy="36" r="14" fill="#f3dccf" /><path d="M18 29v9M18 42.5v.5" stroke="#9a4b2a" strokeWidth="2.4" strokeLinecap="round" /></g>
          : <AgentNode x={18} y={36} r={12} />}
    </Svg>
  );
}

const ROUTE_ICONS: Record<Motif, LucideIcon> = { flow: Phone, map: Map, lanes: Layers, doc: FileText, rooms: PlayCircle, search: Search, gate: Lock, brief: Target, agenda: CalendarCheck, lost: Compass };

/** Small-screen route accent: inline badge that fits the eyebrow line height. */
export function RouteBadge({ motif }: { motif: Motif }) {
  const Icon = ROUTE_ICONS[motif];
  return <span className="zart-badge" aria-hidden><Icon /></span>;
}

const SECTION_ICONS: [RegExp, LucideIcon][] = [
  [/faq/i, HelpCircle], [/news|roadmap/i, Newspaper], [/dashboard/i, LayoutDashboard], [/global/i, Globe2],
  [/knowledge|resource|documentation/i, BookOpen], [/flow|how it works|component|system/i, Workflow],
  [/human|operating|use case/i, Users], [/outcome|spotlight/i, Target], [/channel|solution/i, MessagesSquare],
  [/method|demo|environment/i, PlayCircle], [/presentation|guidance/i, FileText],
];

/** Section-heading accent: content-derived icon in a lime halo with a drawn dashed connector. */
export function SectionGlyph({ label, dark = false }: { label: string; dark?: boolean }) {
  const Icon = SECTION_ICONS.find(([r]) => r.test(label))?.[1] ?? Sparkles;
  return (
    <span className={`zart zart-glyph ${dark ? "is-dark" : ""}`} aria-hidden>
      <svg viewBox="0 0 28 8" className="zart-glyph-line"><path className="draw" d="M0 4h28" stroke="currentColor" strokeWidth="1.5" /></svg>
      <span className="zart-glyph-icon pop d2"><Icon /></span>
    </span>
  );
}
