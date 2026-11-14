import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Compass, Network, PlayCircle } from "lucide-react";
import { DEMO_URL } from "@/data/content";
import { ROOMS } from "@/data/depot-rooms";
import { AgentCallHero } from "./agent-call-hero";

export function HomeHero() {
  const reduce = useReducedMotion();
  return (
    <section id="overview" data-section-nav aria-label="Overview" className="hh on-dark">
      <div className="hh-grid">
        <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}>
          <div className="eyebrow text-[#D1F470]">Zendesk Contact Center</div>
          <h1 className="mt-3 text-[2.1rem] font-semibold leading-[1.02] tracking-[-0.035em] md:text-[3.1rem]">Platform Architect Depot</h1>
          <p className="mt-3 text-lg font-medium text-[#D1F470] md:text-xl">Architect the solution. Demonstrate the value. Accelerate the win.</p>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#F5F5F2]/72">An interactive solution engineering hub built by Zendesk Contact Center Platform Architects. Explore technical architectures, demonstrate real-world use cases, and connect product capabilities to measurable customer outcomes.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/rooms/architecture-integrations" className="depot-btn depot-btn-lime" data-testid="button-cta-architecture"><Network className="h-4 w-4" aria-hidden />Explore Architecture</Link>
            <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="depot-btn depot-btn-outline" data-testid="button-cta-demo"><PlayCircle className="h-4 w-4" aria-hidden />Launch Demo Experience<span className="sr-only">(opens in a new tab)</span></a>
            <Link href="/rooms/use-cases" className="depot-btn depot-btn-outline" data-testid="button-cta-use-cases"><Compass className="h-4 w-4" aria-hidden />Discover Use Cases</Link>
          </div>
        </motion.div>
        <div><AgentCallHero /></div>
      </div>
    </section>
  );
}

export function RoomStrip() {
  return (
    <section aria-labelledby="rooms-title" className="rs" id="rooms" data-section-nav>
      <div className="flex items-end justify-between gap-4">
        <div><h2 id="rooms-title" className="text-2xl font-semibold tracking-[-0.02em]">Pick the conversation</h2></div>
        <p className="hidden max-w-sm text-sm text-[#11110D]/60 md:block">Each room is self-contained, presentable, and backed by documentation. Presenter Mode adds notes for signed-in teams.</p>
      </div>
      <ol className="rs-grid mt-5">
        {ROOMS.map((r) => (
          <li key={r.id}>
            <Link href={r.href} className="rs-card" data-testid={`card-room-${r.id}`}>
              <span className="rs-num">{r.n}</span>
              <span className="mt-6 block text-lg font-semibold leading-tight tracking-tight">{r.title}</span>
              <span className="mt-1.5 block text-sm leading-snug text-[#11110D]/62">{r.summary}</span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold">Enter room<ArrowRight className="rs-arrow h-3.5 w-3.5" aria-hidden /></span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
