import type { AgentSnap, DialEvent, PreviewState } from "@/lib/outbound-dialer";

type NState = { on: boolean; past: boolean; stop?: boolean };
export function Node({ x, y, w = 120, h = 48, label, sub, s }: { x: number; y: number; w?: number; h?: number; label: string; sub?: string; s: NState }) {
  return (
    <g className={`ob-node ${s.on ? "is-on" : ""} ${s.past ? "is-past" : ""} ${s.stop ? "is-stop" : ""}`} transform={`translate(${x},${y})`}>
      <rect className="shadow" x={4} y={6} width={w} height={h} rx={12} />
      <rect className="box" width={w} height={h} rx={12} />
      <title>{label}{sub ? ` · ${sub}` : ""}</title>
      <text x={12} y={sub ? 20 : 29} textLength={label.length * 6.8 > w - 24 ? w - 24 : undefined} lengthAdjust="spacingAndGlyphs">{label}</text>
      {sub && <text className="sub" x={12} y={36} textLength={sub.length * 6 > w - 24 ? w - 24 : undefined} lengthAdjust="spacingAndGlyphs">{sub}</text>}
      {s.on && <circle className="ob-pulse" cx={w - 12} cy={12} r={4} fill={s.stop ? "#C2412A" : "#11110D"} />}
    </g>
  );
}
const ec = (on: boolean, past: boolean, tone?: string) => `ob-edge ${on ? "is-on" : past ? "is-past" : ""} ${tone ? `is-${tone}` : ""}`;
const st = (i: number, node: number, visited: Set<number>, stop = false): NState => ({ on: i === node, past: visited.has(i) && i !== node, stop });

export function PredictiveDiagram({ ev, visited }: { ev: DialEvent; visited: Set<number> }) {
  const n = ev.node; const lines = Math.min(12, ev.lines);
  return (
    <svg viewBox={`0 0 1000 ${Math.max(360, 70 + ev.agents.length * 52)}`} role="img" aria-label={`Predictive dialing diagram. Active stage: ${ev.label}`}>
      <defs><radialGradient id="pg" cx="50%" cy="50%"><stop offset="0%" stopColor="#D1F470" stopOpacity=".35" /><stop offset="100%" stopColor="#D1F470" stopOpacity="0" /></radialGradient></defs>
      <path className={ec(n === 1, visited.has(1))} d="M140 160 H170" />
      <path className={ec(n === 2, visited.has(2))} d="M290 160 H322" />
      <path className={ec(n === 4, visited.has(4))} d="M610 160 H640" />
      <path className={ec(n === 5 || n === 7, visited.has(5))} d="M760 160 H800" />
      <path className={ec(n === 6, visited.has(6), "stop")} d="M700 184 V260" />
      <Node x={20} y={136} label="Customer segment" sub="Profiles" s={st(0, n, visited)} />
      <Node x={170} y={136} label="Campaign engine" sub="Quota share" s={st(1, n, visited)} />
      <g transform="translate(380,160)">
        <circle r={58} fill="url(#pg)" opacity={n === 2 ? 1 : 0.3} />
        <circle r={44} fill="#0E3236" stroke={n === 2 ? "#D1F470" : "rgba(234,242,236,.2)"} strokeWidth={2} />
        <path d="M-32 18 A36 36 0 1 1 32 18" fill="none" stroke="rgba(234,242,236,.15)" strokeWidth={6} strokeLinecap="round" />
        <path d="M-32 18 A36 36 0 1 1 32 18" fill="none" stroke="#D1F470" strokeWidth={6} strokeLinecap="round" pathLength={100} strokeDasharray={`${Math.min(100, lines * 8)} 100`} style={{ transition: "stroke-dasharray .6s" }} />
        <text textAnchor="middle" y={6} fill="#EAF2EC" fontSize={20} fontWeight={700}>{ev.lines}</text>
        <text textAnchor="middle" y={24} fill="rgba(234,242,236,.6)" fontSize={9}>lines paced</text>
        <text textAnchor="middle" y={-56} fill="rgba(234,242,236,.75)" fontSize={11} fontWeight={600}>Predictive pacing</text>
        <text textAnchor="middle" y={72} fill="rgba(234,242,236,.45)" fontSize={9}>service-managed · illustrated</text>
      </g>
      <g>{Array.from({ length: lines }).map((_, i) => { const y = 70 + (i * 180) / Math.max(1, lines - 1 || 1); return <path key={i} className={ec(n === 3, visited.has(3), i % 3 === 2 ? "warn" : undefined)} d={`M424 160 C460 160 470 ${y} 500 ${y}`} />; })}
        <text x={462} y={56} fill="rgba(234,242,236,.6)" fontSize={10}>Outbound calls</text></g>
      <Node x={500} y={136} w={110} label="Answer detect" sub="Check call progress" s={st(4, n, visited)} />
      <Node x={640} y={136} w={120} label="Agent queue" sub="Transfer to queue" s={st(5, n, visited)} />
      <Node x={640} y={262} w={120} label="Abandon risk" sub={`${ev.c.abandoned} abandoned`} s={st(6, n, visited, true)} />
      <g transform="translate(800,40)">
        <text fill="rgba(234,242,236,.75)" fontSize={11} fontWeight={600} y={0}>Agents · connected</text>
        {ev.agents.map((a, i) => <AgentRow key={a.id} a={a} y={14 + i * 52} on={n === 7} />)}
      </g>
    </svg>
  );
}
function AgentRow({ a, y, on }: { a: AgentSnap; y: number; on: boolean }) {
  const col = a.status === "talk" ? "#D1F470" : a.status === "acw" ? "#E8A33D" : a.status === "available" ? "#5FB37A" : a.status === "reserved" ? "#9267C6" : "rgba(234,242,236,.25)";
  return (
    <g transform={`translate(0,${y})`}>
      <rect width={180} height={42} rx={10} fill={a.status === "talk" && on ? "rgba(209,244,112,.16)" : "rgba(234,242,236,.05)"} stroke={col} strokeOpacity={0.6} />
      <circle cx={20} cy={21} r={9} fill="none" stroke={col} strokeWidth={3} />
      {a.status === "talk" && <circle className="ob-pulse" cx={20} cy={21} r={9} fill="none" stroke={col} />}
      <text x={38} y={18} fill="#EAF2EC" fontSize={11} fontWeight={600}>{a.name}</text>
      <text x={38} y={32} fill="rgba(234,242,236,.6)" fontSize={9}>{a.status === "talk" ? `talking · ${a.customer}` : a.status}</text>
    </g>
  );
}

export function ProgressiveDiagram({ ev, visited }: { ev: DialEvent; visited: Set<number> }) {
  const labels = ["Available agent", "Select contact", "Initiate call", "Detect answer", "Connect agent", "Complete call", "Next contact"];
  const cx = 500, cy = 185, rx = 360, ry = 125;
  const pos = labels.map((_, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / labels.length; return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) }; });
  return (
    <svg viewBox="0 0 1000 370" role="img" aria-label={`Progressive dialing loop. Active stage: ${ev.label}`}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="rgba(234,242,236,.08)" strokeWidth={22} />
      {pos.map((p, i) => { const q = pos[(i + 1) % pos.length]; const active = ev.node === (i + 1) % pos.length; return <path key={i} className={ec(active, visited.has((i + 1) % pos.length), ev.tone === "warn" && active ? "warn" : ev.tone === "stop" && active ? "stop" : undefined)} d={`M${p.x} ${p.y} Q${cx + (p.x + q.x - 2 * cx) * 0.62} ${cy + (p.y + q.y - 2 * cy) * 0.62} ${q.x} ${q.y}`} />; })}
      <g transform={`translate(${cx},${cy})`}>
        <circle r={78} fill="#0E3236" stroke="rgba(209,244,112,.25)" />
        <circle className="ob-spin" r={66} fill="none" stroke="#D1F470" strokeOpacity={0.4} strokeDasharray="4 10" />
        {ev.agents.map((a, i) => { const ang = (i / ev.agents.length) * Math.PI * 2 - Math.PI / 2; const col = a.status === "talk" ? "#D1F470" : a.status === "acw" ? "#E8A33D" : a.status === "available" ? "#5FB37A" : a.status === "reserved" ? "#9267C6" : "#4a5d5f"; return <g key={a.id} transform={`translate(${Math.cos(ang) * 46},${Math.sin(ang) * 46})`}><circle r={13} fill={col} /><text textAnchor="middle" y={4} fontSize={9} fontWeight={700} fill="#11110D">{a.name.split(" ").map((x) => x[0]).join("")}</text></g>; })}
        <text textAnchor="middle" y={4} fill="#EAF2EC" fontSize={11} fontWeight={700}>Agent pool</text>
        <text textAnchor="middle" y={18} fill="rgba(234,242,236,.55)" fontSize={9}>1 dial per free agent</text>
      </g>
      {pos.map((p, i) => <Node key={i} x={p.x - 62} y={p.y - 24} w={124} label={labels[i]} s={st(i, ev.node, visited, ev.tone === "stop" && i === ev.node)} />)}
    </svg>
  );
}

export function PreviewDiagram({ s, node, contact }: { s: PreviewState; node: number; contact: string }) {
  const labels = ["Campaign contact", "Preview workspace", "Profile review", "Agent decision", "Dial customer", "Conversation", "Disposition"];
  const xs = labels.map((_, i) => 20 + i * 138); const ys = labels.map((_, i) => 70 + Math.sin((i / 6) * Math.PI) * -26);
  const frac = s.reviewSec ? s.countdown / s.reviewSec : 0; const C = 2 * Math.PI * 30;
  const removed = s.phase === "removed"; const na = s.phase === "noanswer";
  return (
    <svg viewBox="0 0 1000 330" role="img" aria-label={`Preview dialing for ${contact}. Phase ${s.phase}.`}>
      {xs.slice(0, -1).map((x, i) => <path key={i} className={ec(node === i + 1, node > i + 1)} d={`M${x + 118} ${ys[i] + 24} L${xs[i + 1]} ${ys[i + 1] + 24}`} />)}
      {labels.map((l, i) => <Node key={l} x={xs[i]} y={ys[i]} w={118} label={l} sub={i === 0 ? contact : i === 3 && (removed || na) ? (removed ? "removed" : "no answer") : undefined} s={{ on: node === i, past: node > i, stop: i === 3 && (removed || na) }} />)}
      <g transform="translate(470,200)">
        <circle r={30} fill="#0E3236" stroke="rgba(234,242,236,.15)" strokeWidth={6} />
        <circle r={30} fill="none" stroke={frac < 0.3 ? "#E8A33D" : "#D1F470"} strokeWidth={6} strokeDasharray={`${C * frac} ${C}`} transform="rotate(-90)" style={{ transition: "stroke-dasharray .9s linear" }} />
        <text textAnchor="middle" y={6} fill="#EAF2EC" fontSize={18} fontWeight={700}>{s.phase === "reviewing" || s.phase === "queued" ? s.countdown : "–"}</text>
        <text x={44} y={-6} fill="rgba(234,242,236,.8)" fontSize={11} fontWeight={600}>Preview countdown</text>
        <text x={44} y={10} fill="rgba(234,242,236,.5)" fontSize={9}>configurable review timeout</text>
      </g>
      <g transform="translate(20,262)">
        <rect width={960} height={50} rx={12} fill="none" stroke="rgba(234,242,236,.25)" strokeDasharray="5 6" />
        <text x={16} y={21} fill="rgba(234,242,236,.75)" fontSize={11} fontWeight={600}>Not this: ordinary manual click-to-dial</text>
        <text x={16} y={37} fill="rgba(234,242,236,.5)" fontSize={9}>Agent types a number in the CCP: no campaign list, segment, pacing, communication limits or preview timer.</text>
      </g>
    </svg>
  );
}

export function AgentlessDiagram({ ev, visited }: { ev: DialEvent; visited: Set<number> }) {
  const labels = ["Segment", "Agentless campaign", "Automated dialing", "Answer detection", "Message / IVR", "Customer response", "Completed"];
  const n = ev.node; const c = ev.c; const tot = Math.max(1, c.dialed);
  const houses = 48; const hum = Math.round((c.human / tot) * houses), vm = Math.round((c.voicemail / tot) * houses), na = Math.round((c.noAnswer / tot) * houses);
  return (
    <svg viewBox="0 0 1000 360" role="img" aria-label={`Agentless notification diagram. Active stage: ${ev.label}`}>
      {labels.map((l, i) => i < labels.length - 1 && <path key={l} className={ec(n === i + 1, visited.has(i + 1))} d={`M${20 + i * 140 + 120} 44 H${20 + (i + 1) * 140}`} />)}
      {labels.map((l, i) => <Node key={l} x={20 + i * 140} y={20} w={120} label={l} s={st(i, n, visited)} />)}
      <g transform="translate(170,230)">
        <path d="M-14 70 L0 -30 L14 70 Z" fill="#123A3E" stroke="rgba(234,242,236,.35)" />
        <circle r={8} cy={-34} fill="#D1F470" />
        {[0, 1, 2].map((k) => <circle key={k} className="ob-wave" cy={-34} r={60} strokeWidth={2} style={{ animationDelay: `${k * 0.8}s`, opacity: n >= 2 && n <= 4 ? 1 : 0.15 }} />)}
        <text x={-60} y={95} fill="rgba(234,242,236,.6)" fontSize={10}>{ev.lines} concurrent lines</text>
      </g>
      <g transform="translate(330,120)">
        {Array.from({ length: houses }).map((_, i) => { const col = i < hum ? "#D1F470" : i < hum + vm ? "#8EC5C9" : i < hum + vm + na ? "#E8A33D" : "rgba(234,242,236,.15)"; const x = (i % 12) * 48, y = Math.floor(i / 12) * 48; return <g key={i} transform={`translate(${x},${y})`}><path d="M0 18 L14 4 L28 18 V34 H0 Z" fill={col} style={{ transition: "fill .5s" }} /><rect x={11} y={24} width={6} height={10} fill="#0A2427" /></g>; })}
        <g transform="translate(0,205)" fontSize={10} fill="rgba(234,242,236,.75)">
          <rect width={10} height={10} fill="#D1F470" /><text x={14} y={9}>Human · message + IVR</text>
          <rect x={170} width={10} height={10} fill="#8EC5C9" /><text x={184} y={9}>Voicemail branch</text>
          <rect x={310} width={10} height={10} fill="#E8A33D" /><text x={324} y={9}>No answer · retry pool</text>
        </g>
      </g>
    </svg>
  );
}
