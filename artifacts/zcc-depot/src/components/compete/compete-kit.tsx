import { useEffect } from "react";
import { COMPETITORS as COMPETITOR_NAV } from "@/data/competitors";

export const FIVE9_LOGO = `${import.meta.env.BASE_URL}brands/five9.svg`;

/** Registry of real competitor entries. Add an entry here when a new battlecard endpoint exists. */
export const COMPETITORS = COMPETITOR_NAV.map(competitor => ({
  ...competitor, logo: `${import.meta.env.BASE_URL}${competitor.logo}`,
}));

export function useCompeteMeta(title: string, desc: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    const meta = [
      ['meta[name="description"]', desc],
      ['meta[property="og:title"]', title],
      ['meta[property="og:description"]', desc],
      ['meta[name="twitter:title"]', title],
      ['meta[name="twitter:description"]', desc],
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
  }, [title, desc]);
}

/** Original animated illustration: a voice call and a ticket converge into one resolution workspace. */
export function CompeteArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 260" className={`cmp-art ${className}`} role="img" aria-label="Illustration: a voice call and a ticket converging into one service workspace">
      <defs>
        <linearGradient id="cmpg" x1="0" x2="1"><stop offset="0" stopColor="#4a63e8" stopOpacity=".7" /><stop offset="1" stopColor="#D1F470" /></linearGradient>
      </defs>
      {/* voice node */}
      <g className="float">
        <circle cx="62" cy="70" r="22" fill="none" stroke="#4a63e8" className="pulse" />
        <circle cx="62" cy="70" r="22" fill="#1b1f2e" stroke="#4a63e8" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} className="bar" x={49 + i * 6} y={60} width="3.5" height="20" rx="1.5" fill="#D1F470" style={{ animationDelay: `${i * -0.18}s` }} />
        ))}
      </g>
      {/* ticket node */}
      <g className="float d2">
        <rect x="26" y="160" width="78" height="54" rx="10" fill="#1b1f2e" stroke="rgba(245,245,242,.25)" />
        <rect x="36" y="172" width="34" height="5" rx="2.5" fill="#D1F470" />
        <rect x="36" y="184" width="56" height="4" rx="2" fill="rgba(245,245,242,.35)" />
        <rect x="36" y="194" width="44" height="4" rx="2" fill="rgba(245,245,242,.2)" />
      </g>
      <path d="M86 70 C150 70 150 120 196 124" fill="none" stroke="url(#cmpg)" strokeWidth="2" className="flow" />
      <path d="M104 186 C150 186 150 136 196 132" fill="none" stroke="url(#cmpg)" strokeWidth="2" className="flow" />
      {/* workspace */}
      <g>
        <rect x="196" y="56" width="200" height="150" rx="16" fill="#203524" stroke="rgba(209,244,112,.35)" />
        <rect x="196" y="56" width="200" height="24" rx="16" fill="#2a4630" />
        <circle cx="212" cy="68" r="3" fill="#D1F470" /><circle cx="222" cy="68" r="3" fill="rgba(245,245,242,.3)" /><circle cx="232" cy="68" r="3" fill="rgba(245,245,242,.3)" />
        <rect x="210" y="92" width="74" height="100" rx="10" fill="rgba(245,245,242,.06)" />
        <rect x="218" y="102" width="50" height="5" rx="2.5" fill="rgba(245,245,242,.6)" />
        <rect x="218" y="114" width="58" height="4" rx="2" fill="rgba(245,245,242,.25)" />
        <rect x="218" y="124" width="40" height="4" rx="2" fill="rgba(245,245,242,.25)" />
        <rect x="218" y="146" width="58" height="34" rx="7" fill="#4a63e8" fillOpacity=".35" />
        <rect x="294" y="92" width="88" height="44" rx="10" fill="#D1F470" />
        <rect x="302" y="102" width="44" height="5" rx="2.5" fill="#11110D" />
        <rect className="tick" x="302" y="114" width="70" height="4" rx="2" fill="#203524" />
        <rect className="tick" x="302" y="123" width="52" height="4" rx="2" fill="#203524" style={{ animationDelay: ".3s" }} />
        <rect x="294" y="144" width="88" height="48" rx="10" fill="rgba(245,245,242,.06)" />
        <path d="M306 176 l10 -12 l10 6 l12 -14 l14 8 l16 -10" fill="none" stroke="#D1F470" strokeWidth="2" className="flow rev" />
      </g>
      <text x="196" y="232" fill="rgba(245,245,242,.45)" fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="2">ONE WORKSPACE · ONE RECORD</text>
    </svg>
  );
}
