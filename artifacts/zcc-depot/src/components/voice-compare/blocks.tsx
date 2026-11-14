import { useState } from "react";
import { Plus } from "lucide-react";
import { COMPARISON_FAQ, COMPARISON_SOURCES, DISCOVERY_TOPICS, MIGRATION_STEPS } from "@/data/voice-comparison";
import { Ext } from "@/components/kit";

export function Executive() {
  return (
    <div className="grid gap-4 md:grid-cols-12">
      <div className="vc-card md:col-span-5">
        <div className="eyebrow text-[#203524]">Zendesk Voice</div>
        <p className="mt-2 text-xl font-semibold leading-snug">Bring phone support into Zendesk with familiar administration.</p>
        <p className="mt-2 text-sm leading-relaxed text-[#11110D]/72">Often the better fit when straightforward call handling, speed to launch and simpler administration meet the need.</p>
      </div>
      <div className="vc-card md:col-span-7 !border-[#203524] !bg-[#203524] text-[#F5F5F2]">
        <div className="eyebrow text-[#D1F470]">Zendesk Contact Center</div>
        <p className="mt-2 text-xl font-semibold leading-snug">A CCaaS foundation built on Amazon Connect for configurable voice operations.</p>
        <p className="mt-2 text-sm leading-relaxed text-[#F5F5F2]/80">Merits evaluation when requirements demand deeper orchestration, integrations or scale, with a plan for flows, identity, telephony and ownership.</p>
      </div>
      <div className="md:col-span-12 rounded-[1.1rem] bg-[#D1F470] p-5 text-[#11110D]">
        <p className="text-base font-semibold leading-snug">The deciding question is operational complexity, not a fixed agent count. Both solutions can support growing teams.</p>
      </div>
    </div>
  );
}

export function Discovery() {
  const [active, setActive] = useState(0);
  const t = DISCOVERY_TOPICS[active];
  return (
    <div className="grid gap-4 lg:grid-cols-[17rem_1fr]">
      <div role="group" aria-label="Discovery topics" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col">
        {DISCOVERY_TOPICS.map((d, i) => (
          <button key={d.title} type="button" aria-pressed={active === i} onClick={() => setActive(i)} className="vc-chip shrink-0 justify-start !rounded-xl lg:w-full" data-testid={`button-discovery-${i}`}>
            <span className="mono text-xs opacity-70">{String(i + 1).padStart(2, "0")}</span>{d.title}
          </button>
        ))}
      </div>
      <div className="vc-card" aria-live="polite" data-testid="panel-discovery">
        <div className="eyebrow text-[#203524]">{t.title}</div>
        <p className="mt-2 text-2xl font-semibold leading-snug">{t.question}</p>
        <ul className="mt-4 grid gap-2 md:grid-cols-3">
          {t.prompts.map(p => <li key={p} className="rounded-xl bg-[#F5F5F2] p-3 text-sm leading-snug">{p}</li>)}
        </ul>
      </div>
    </div>
  );
}

export function Migration() {
  return (
    <ol className="grid gap-3 md:grid-cols-5">
      {MIGRATION_STEPS.map((s, i) => (
        <li key={s.title} className="vc-card relative !p-4" data-testid={`step-migration-${i}`}>
          <span className="room-index">{i + 1}</span>
          <h3 className="mt-3 font-semibold leading-tight">{s.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#11110D]/72">{s.detail}</p>
        </li>
      ))}
    </ol>
  );
}

export function Faq() {
  return (
    <div className="grid gap-2">
      {COMPARISON_FAQ.map((f, i) => (
        <details key={f.q} className="vc-faq rounded-2xl border border-[#11110D]/12 bg-white" data-testid={`faq-${i}`}>
          <summary>{f.q}<Plus className="h-5 w-5" aria-hidden /></summary>
          <p className="px-4 pb-4 text-sm leading-relaxed text-[#11110D]/78">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function Sources() {
  return (
    <ol className="grid gap-2 md:grid-cols-2">
      {COMPARISON_SOURCES.map((s, i) => (
        <li key={s.id} className="vc-card flex gap-3 !p-4" data-testid={`item-source-${s.id}`}>
          <span className="mono text-xs font-semibold text-[#203524]">{String(i + 1).padStart(2, "0")}</span>
          <div className="min-w-0">
            <Ext href={s.url} className="font-semibold underline decoration-[#203524]/30 underline-offset-4 hover:decoration-[#203524]" testId={`link-source-${s.id}`}>{s.title}</Ext>
            <p className="mt-1 text-sm text-[#11110D]/70">{s.note}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
