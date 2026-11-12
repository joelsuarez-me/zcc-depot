import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import "./_group.css";

// Extracted from components/kit.tsx before the visual refresh. No app dependencies.
function PageHero({ eyebrow, title, lede, children }: { eyebrow: string; title: ReactNode; lede: ReactNode; children?: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <section className="on-dark relative overflow-hidden bg-[#203524] text-[#F5F5F2]">
      <div className="grid-lines absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 pb-4 pt-20 md:px-8">
        <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}>
          <div className="grid gap-2 md:grid-cols-12 md:items-end md:gap-6">
            <div className="md:col-span-7">
              <div className="eyebrow mb-1.5 text-[0.625rem] text-[#D1F470]">{eyebrow}</div>
              <h1 className="max-w-4xl text-2xl font-semibold leading-[1.08] tracking-tight md:text-[2rem]">{title}</h1>
            </div>
            <p className="max-w-3xl text-sm leading-snug text-[#F5F5F2]/75 md:col-span-5">{lede}</p>
          </div>
          {children && <div className="mt-3 flex flex-wrap items-center gap-2 [&_a]:py-1.5 [&_button]:py-1.5">{children}</div>}
        </motion.div>
      </div>
    </section>
  );
}

export function Current() {
  return (
    <div className="zcc-current-reference min-h-screen bg-[#F5F5F2]">
      <PageHero eyebrow="Demos · Guided access" title={<>One story. <span className="serif italic text-[#D1F470]">Seven connected rooms.</span></>}
        lede="Guide your audience from the customer's first interaction through the agent experience, the architecture behind it, and the business impact. Then hand them the walkthrough.">
        <span className="inline-flex items-center rounded-full bg-[#D1F470] px-5 py-1.5 text-sm font-semibold text-[#11110D]">Launch guided demo</span>
        <span className="inline-flex items-center rounded-full border border-[#F5F5F2]/25 px-5 py-1.5 text-sm font-semibold">Demo methodology</span>
        <span className="inline-flex items-center rounded-full border border-[#F5F5F2]/25 px-5 py-1.5 text-sm font-semibold">Video highlights</span>
      </PageHero>
    </div>
  );
}
