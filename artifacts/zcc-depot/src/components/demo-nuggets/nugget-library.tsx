import { ArrowDownRight, Bot, ClipboardCheck, Sparkles, Video } from "lucide-react";
import type { DemoNugget } from "@/data/demo-nuggets";

const cues = [
  { Icon: Sparkles, tag: "Agent assist", bg: "bg-[#D1F470]", fg: "text-[#203524]" },
  { Icon: ClipboardCheck, tag: "Quality review", bg: "bg-[#203524]", fg: "text-[#D1F470]" },
  { Icon: Bot, tag: "Autonomous voice", bg: "bg-[#11110D]", fg: "text-[#F5F5F2]" },
  { Icon: Video, tag: "Visual support", bg: "bg-[#D1F470]", fg: "text-[#203524]" },
];

/** Compact list of demos; each item is a native anchor to its section. */
export function NuggetLibrary({ nuggets, onSelect }: { nuggets: readonly DemoNugget[]; onSelect: () => void }) {
  return (
    <nav aria-label="Demo library" className="rounded-[1.25rem] border border-[#11110D]/15 bg-[#FBFBF8] p-2" data-testid="nav-nugget-library">
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {nuggets.map((n, i) => {
          const c = cues[i % cues.length];
          const dark = i % 2 === 1;
          return (
            <li key={n.id} className="min-w-0">
              <a href={`#${n.id}`} onClick={onSelect} data-testid={`link-library-${n.id}`}
                className={`group grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 rounded-2xl border p-3 transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7DA33A] ${dark ? "border-[#203524] bg-[#203524] text-[#F5F5F2] hover:bg-[#2B4630]" : "border-[#CDD8BA] bg-[#EEF4E2] text-[#11110D] hover:bg-[#E3EFCB]"}`}>
                <span className={`row-span-2 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${dark ? "bg-[#D1F470] text-[#203524]" : `${c.bg} ${c.fg}`} transition-transform duration-300 group-hover:-rotate-6`}><c.Icon className="h-5 w-5" aria-hidden /></span>
                <span className="min-w-0 flex-1">
                  <span className={`mono block text-[0.65rem] uppercase tracking-[.12em] ${dark ? "text-[#D1F470]" : "text-[#3F5A2A]"}`}>{c.tag}</span>
                  <span className="block text-sm font-semibold leading-snug">{n.title}</span>
                </span>
                <span className={`col-start-2 flex items-center gap-1 text-xs font-semibold ${dark ? "text-[#D1F470]" : "text-[#203524]"}`}>Open demo<ArrowDownRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5" aria-hidden /></span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
