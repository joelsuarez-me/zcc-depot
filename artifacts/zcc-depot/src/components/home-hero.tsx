import { motion, useReducedMotion } from "framer-motion";
import { AgentCallHero } from "./agent-call-hero";

export function HomeHero() {
  const reduce = useReducedMotion();
  return (
    <section id="overview" data-section-nav aria-label="Overview" className="hh on-dark">
      <div className="hh-grid">
        <motion.div className="hh-copy" initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}>
          <div className="eyebrow text-[#D1F470]">Zendesk Contact Center</div>
          <h1 className="hh-title mt-3 text-[2.1rem] font-semibold leading-[1.02] tracking-[-0.035em] md:text-[3.1rem]">Platform Architect Depot</h1>
          <p className="hh-tag mt-3 text-lg font-medium text-[#D1F470] md:text-xl">Architect the solution. Demonstrate the value. Accelerate the win.</p>
          <p className="hh-lede mt-3 max-w-xl text-[15px] leading-relaxed text-[#F5F5F2]/72">An interactive solution engineering hub built by Zendesk Contact Center Platform Architects. Explore technical architectures, demonstrate real-world use cases, and connect product capabilities to measurable customer outcomes.</p>
        </motion.div>
        <div className="hh-art"><AgentCallHero /></div>
      </div>
    </section>
  );
}
