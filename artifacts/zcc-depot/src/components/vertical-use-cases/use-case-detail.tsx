import { useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Maximize2, Minimize2, MessageCircleQuestion } from "lucide-react";
import type { CapabilityKind, Industry, UseCaseSource, VerticalUseCase, WorkflowNode } from "@/data/verticals/types";
import { Ext } from "@/components/kit";
import { IndustryIcon } from "./industry-icon";
import { ScenarioReviewStatus, SourceReviewStatus } from "./review-status";

const KIND_CLASS: Record<CapabilityKind, string> = {
  "Zendesk capability": "k-zendesk", "AWS configuration": "k-aws", "External integration": "k-external", "Conceptual workflow": "k-concept",
};
export function KindBadge({ kind }: { kind: CapabilityKind }) {
  return <span className={`vuc-kind ${KIND_CLASS[kind]}`}>{kind}</span>;
}

function Sec({ letter, title, id, children }: { letter: string; title: string; id: string; children: ReactNode }) {
  return (
    <section className="vuc-sec" aria-labelledby={id}>
      <div className="vuc-sec-head"><span className="vuc-letter" aria-hidden>{letter}</span>
        <h3 id={id} className="text-lg font-semibold tracking-tight md:text-xl">{title}</h3></div>
      {children}
    </section>
  );
}

function NodeExplorer({ nodes, label, testId }: { nodes: WorkflowNode[]; label: string; testId: string }) {
  const [active, setActive] = useState<string | null>(nodes[0]?.id ?? null);
  const [expanded, setExpanded] = useState(false);
  const reduce = useReducedMotion();
  const node = nodes.find(n => n.id === active);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="eyebrow text-[#11110D]/55">{label}</span>
        <button type="button" className="room-pill" aria-expanded={expanded} onClick={() => setExpanded(e => !e)} data-testid={`button-expand-${testId}`}>
          {expanded ? <Minimize2 className="h-3.5 w-3.5" aria-hidden /> : <Maximize2 className="h-3.5 w-3.5" aria-hidden />}
          {expanded ? "Compact view" : "Expand diagram"}
        </button>
      </div>
      <ol className={`vuc-flow ${expanded ? "is-expanded" : ""}`} aria-label={label}>
        {nodes.map((n, i) => (
          <li key={n.id} className="contents">
            <button type="button" className="vuc-node" aria-pressed={active === n.id} onClick={() => setActive(active === n.id ? null : n.id)} data-testid={`node-${testId}-${n.id}`}>
              <span className="n">{String(i + 1).padStart(2, "0")}</span><span>{n.label}</span>
              {expanded && <span className="text-[0.72rem] font-normal opacity-70">{n.component}</span>}
            </button>
            {i < nodes.length - 1 && <ArrowRight className="vuc-arrow h-3.5 w-3.5" aria-hidden />}
          </li>
        ))}
      </ol>
      <AnimatePresence mode="wait" initial={false}>
        {node && (
          <motion.div key={node.id} className="vuc-explain" role="region" aria-live="polite" aria-label={`${node.label} explanation`}
            initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
            <div className="flex flex-wrap items-center gap-2"><strong className="text-[#D1F470]">{node.label}</strong><span className="mono text-xs text-[#F5F5F2]/60">{node.component}</span><KindBadge kind={node.kind} /></div>
            <p className="mt-2 text-sm leading-relaxed text-[#F5F5F2]/80">{node.detail}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function UseCaseDetail({ useCase, industry, sources, present = false }: { useCase: VerticalUseCase; industry?: Industry; sources: UseCaseSource[]; present?: boolean }) {
  const p = present ? "p" : "d";
  const caseSources = sources.filter(s => useCase.sourceIds.includes(s.id));
  return (
    <article data-testid={`detail-${useCase.id}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {industry && <span className="room-tag"><IndustryIcon name={industry.icon} className="h-3.5 w-3.5" />{industry.name}</span>}
        <span className="room-tag">{useCase.category}</span>
        <span className="vuc-kind k-concept">Curated hypothetical example</span>
      </div>
      <h2 className="vuc-title mt-3 text-[1.75rem] font-semibold leading-[1.08] tracking-tight md:text-[2.4rem]" data-testid="text-usecase-title">{useCase.title}</h2>
      <ScenarioReviewStatus useCase={useCase} />

      <Sec letter="A" title="Customer challenge" id={`${p}-challenge`}>
        <p className="max-w-3xl text-base leading-relaxed text-[#11110D]/80 md:text-lg">{useCase.challenge}</p>
      </Sec>

      <Sec letter="B" title="Zendesk Contact Center solution" id={`${p}-solution`}>
        <ul className="grid gap-2 md:grid-cols-2">
          {useCase.solution.map((s, i) => (
            <li key={i} className="rounded-2xl border border-[var(--line)] bg-[#F5F5F2] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{s.title}</strong><KindBadge kind={s.kind} /></div>
              <p className="mt-1.5 text-sm leading-relaxed text-[#11110D]/70">{s.detail}</p>
            </li>
          ))}
        </ul>
      </Sec>

      <Sec letter="C" title="Interactive workflow and architecture" id={`${p}-workflow`}>
        <div className="grid gap-6">
          <NodeExplorer key={`w-${useCase.id}`} nodes={useCase.workflow} label="Customer journey" testId={`${p}-workflow`} />
          <NodeExplorer key={`a-${useCase.id}`} nodes={useCase.architecture} label="Architecture components" testId={`${p}-architecture`} />
        </div>
      </Sec>

      <Sec letter="D" title="Potential business outcomes" id={`${p}-outcomes`}>
        <ul className="grid gap-2 md:grid-cols-2">
          {useCase.outcomes.map((o, i) => <li key={i} className="vuc-outcome"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{o}</li>)}
        </ul>
        <p className="mt-2 text-xs text-[#11110D]/55">Directional benefits only; no quantified results are claimed.</p>
      </Sec>

      <Sec letter="E" title="Demo walkthrough" id={`${p}-demo`}>
        <ol className="grid gap-2">
          {useCase.demoSteps.map((s, i) => (
            <li key={i} className="vuc-step">
              <span className="room-index">{i + 1}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{s.title}</strong>
                  <span className={`vuc-kind ${s.conceptual ? "k-concept" : "k-zendesk"}`}>{s.conceptual ? "Conceptual demonstration" : "Requires configured environment"}</span></div>
                <p className="mt-1 text-sm leading-relaxed text-[#11110D]/70">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-[#11110D]/55">This page illustrates a demonstration path. It does not execute or connect to any business process.</p>
      </Sec>

      <Sec letter="F" title="Discovery questions" id={`${p}-discovery`}>
        <ul className="grid gap-2">
          {useCase.discovery.map((q, i) => <li key={i} className="flex gap-3 text-[0.95rem] leading-relaxed"><MessageCircleQuestion className="mt-1 h-4 w-4 shrink-0 text-[#203524]" aria-hidden />{q}</li>)}
        </ul>
      </Sec>

      {caseSources.length > 0 && (
        <div className="vuc-sec">
          <div className="eyebrow mb-2 text-[#11110D]/55">Public sources for the building blocks</div>
          <ul className="grid gap-1.5 text-sm">
            {caseSources.map(s => <li key={s.id}><Ext href={s.url} className="font-semibold underline-offset-2 hover:underline" testId={`link-source-${p}-${s.id}`}>{s.title}</Ext><span className="text-[#11110D]/60"> · {s.scope}</span><SourceReviewStatus source={s} /></li>)}
          </ul>
        </div>
      )}
    </article>
  );
}
