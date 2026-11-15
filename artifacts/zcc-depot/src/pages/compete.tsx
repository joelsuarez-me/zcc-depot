import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ShieldCheck, Lock, Plus } from "lucide-react";
import { COMPETITORS, CompeteArt, useCompeteMeta } from "@/components/compete/compete-kit";
import "@/styles/compete.css";

const TITLE = "Compete | ZCC Depot";
const DESC = "Presenter-only competitive positioning for Zendesk Contact Center: sourced, dated and ready to say out loud.";

export default function CompetePage() {
  useCompeteMeta(TITLE, DESC);
  const reduce = useReducedMotion();
  return (
    <div className="cmp">
      <div className="cmp-wrap">
        <motion.header className="cmp-hero" initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}>
          <div>
            <div className="eyebrow mb-3 text-[#D1F470]">ZCC Depot · Compete</div>
            <h1 className="cmp-title">Win the room with a <em>sourced</em> story, not a hot take.</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#F5F5F2]/70">Source-aware positioning per competitor: the contrast, the discovery question, the proof and the source date. Pick a competitor to prepare your conversation.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="cmp-chip is-lime"><Lock className="h-3.5 w-3.5" aria-hidden /> Presenter only</span>
              <span className="cmp-chip"><ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Dated sources, no guarantees</span>
            </div>
          </div>
          <CompeteArt />
        </motion.header>

        <section className="mt-6" aria-labelledby="cmp-list">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="eyebrow text-[#203524]">Battlecards</div>
              <h2 id="cmp-list" className="cmp-h2">Choose a competitor</h2>
            </div>
            <span className="mono text-xs text-[#11110D]/50" data-testid="text-compete-count">{COMPETITORS.length} available</span>
          </div>
          <div className="cmp-grid">
            {COMPETITORS.map((c, i) => (
              <motion.div key={c.id} initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}>
                <Link href={c.href} className="cmp-card" data-testid={`link-compete-${c.id}`}>
                  <div className="flex items-center justify-between">
                    <span className="cmp-logo"><img src={c.logo} alt={`${c.name} logo`} /></span>
                    <span className="cmp-go"><ArrowRight className="h-4 w-4" aria-hidden /></span>
                  </div>
                  <div>
                    <div className="eyebrow text-[#11110D]/50">{c.kind}</div>
                    <h3 className="text-xl font-semibold tracking-tight">Zendesk vs {c.name}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#11110D]/70">{c.blurb}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Differentiators", "Objections", "Discovery", "Sources"].map((t) => <span key={t} className="cmp-tag">{t}</span>)}
                  </div>
                </Link>
              </motion.div>
            ))}
            <div className="cmp-slot" aria-hidden>
              <Plus className="h-5 w-5" />
              <span className="font-semibold text-[#11110D]/70">More battlecards land here</span>
              <span>Each new card ships only once its sources are reviewed.</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
