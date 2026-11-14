import { SectionBriefActions } from "@/components/section-brief-actions";
import type { ReactNode } from "react";
import { SectionLink } from "@/components/section-link";

export type HeadArt = "brief" | "matrix" | "fit" | "discover" | "path" | "faq" | "sources";

function Art({ kind }: { kind: HeadArt }) {
  switch (kind) {
    case "brief": return (<svg viewBox="0 0 144 72"><path className="l vc-a-dash" d="M14 36 C40 10 60 10 72 36 S104 62 130 36" /><circle className="f vc-a-bob" cx="14" cy="36" r="6" /><circle className="d vc-a-bob vc-d2" cx="130" cy="36" r="6" /><rect className="f vc-a-fade" x="66" y="30" width="12" height="12" rx="3" /></svg>);
    case "matrix": return (<svg viewBox="0 0 144 72">{[0, 1, 2].map(r => <g key={r}><rect className="d" x="14" y={14 + r * 16} width="30" height="8" rx="4" /><rect className={`f vc-a-grow vc-d${r + 1}`} x="54" y={14 + r * 16} width="34" height="8" rx="4" /><rect className={`d vc-a-grow vc-d${3 - r}`} x="96" y={14 + r * 16} width="34" height="8" rx="4" /></g>)}</svg>);
    case "fit": return (<svg viewBox="0 0 144 72"><line className="l" x1="18" y1="36" x2="126" y2="36" /><circle className="d" cx="18" cy="36" r="5" /><circle className="d" cx="126" cy="36" r="5" /><circle className="f vc-a-slide" cx="58" cy="36" r="9" /></svg>);
    case "discover": return (<svg viewBox="0 0 144 72"><circle className="l vc-a-dash" cx="60" cy="34" r="18" /><line className="l" x1="73" y1="47" x2="90" y2="62" /><circle className="f vc-a-fade" cx="60" cy="34" r="5" /><rect className="d vc-a-fade vc-d2" x="102" y="18" width="28" height="6" rx="3" /><rect className="d vc-a-fade vc-d3" x="102" y="32" width="20" height="6" rx="3" /></svg>);
    case "path": return (<svg viewBox="0 0 144 72"><path className="l vc-a-dash" d="M12 54 H44 V36 H80 V18 H132" />{[12, 44, 80, 132].map((x, i) => <circle key={x} className={`f vc-a-fade vc-d${i}`} cx={x} cy={[54, 45, 27, 18][i]} r="5" />)}</svg>);
    case "faq": return (<svg viewBox="0 0 144 72"><rect className="l" x="16" y="14" width="70" height="30" rx="10" /><rect className="f vc-a-bob" x="58" y="34" width="70" height="26" rx="10" /><circle className="d vc-a-fade" cx="38" cy="29" r="3" /><circle className="d vc-a-fade vc-d1" cx="51" cy="29" r="3" /><circle className="d vc-a-fade vc-d2" cx="64" cy="29" r="3" /></svg>);
    case "sources": return (<svg viewBox="0 0 144 72"><g className="vc-a-spin"><circle className="l" cx="72" cy="36" r="24" strokeDasharray="10 8" /></g><circle className="f" cx="72" cy="36" r="8" />{[[30, 18], [114, 18], [30, 56], [114, 56]].map(([x, y], i) => <circle key={i} className={`d vc-a-fade vc-d${i}`} cx={x} cy={y} r="4" />)}</svg>);
  }
}

export function VcHead({ id, eyebrow, title, lede, art }: { id: string; eyebrow: string; title: ReactNode; lede?: ReactNode; art: HeadArt }) {
  return (
    <header className="vc-head" data-testid={`head-${id}`}>
      <div className="vc-art vc-anim" aria-hidden><Art kind={art} /></div>
      <div>
        <div className="eyebrow mb-1 flex items-center gap-2 text-[#D1F470]">{eyebrow}<SectionLink id={id} label={eyebrow} dark /></div>
        <h2 id={`${id}-title`}>{title}</h2>
      </div>
      {lede && <p className="vc-lede">{lede}</p>}
      <div className="col-span-full"><SectionBriefActions sectionId={id} dark /></div>
    </header>
  );
}

export function VcSection({ id, children, tone = "paper" }: { id: string; children: ReactNode; tone?: "paper" | "soft" }) {
  return (
    <section id={id} data-brief-scope data-section-nav aria-labelledby={`${id}-title`} className={`vc-sec ${tone === "soft" ? "bg-[#ECECE6]" : ""}`}>
      <div className="vc-wrap">{children}</div>
    </section>
  );
}
