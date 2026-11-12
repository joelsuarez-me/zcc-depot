import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { RefreshCw } from "lucide-react";
import { Ext, Note, PageHero, Reveal, Section, SectionHead } from "@/components/kit";
import { CORE_COMPONENTS, LAMBDAS, LINKS } from "@/data/content";
import { SystemDataFlow } from "@/components/system-data-flow";

function Lambdas() {
  const [tab, setTab] = useState<"deployment" | "runtime">("runtime");
  const [q, setQ] = useState("");
  const list = LAMBDAS[tab].filter((l) => (l.n + l.d).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mt-12 rounded-[2rem] border border-[#11110D]/10 bg-[#FBFBF8] p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><h3 className="text-2xl font-semibold">AWS Lambda functions</h3><p className="mt-1 text-[#11110D]/60">Some prepare the environment during deployment. Others respond to calls, transcripts, recordings, analytics, or agent UI requests.</p></div>
        <div className="flex flex-wrap gap-2">
          <div role="tablist" className="flex rounded-full bg-[#11110D]/6 p-1">
            {(["deployment", "runtime"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} data-testid={`tab-lambda-${t}`} className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${tab === t ? "bg-[#203524] text-[#D1F470]" : ""}`}>{t} ({LAMBDAS[t].length})</button>
            ))}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter functions" aria-label="Filter Lambda functions" data-testid="input-lambda-filter" className="rounded-full border border-[#11110D]/15 bg-transparent px-4 py-1.5 text-sm" />
        </div>
      </div>
      <p className="mono mt-4 text-xs text-[#11110D]/50">{tab === "deployment" ? "Configure and discover resources" : "Process contact and app events"}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {list.map((l) => (
          <div key={l.n} className="rounded-2xl border border-[#11110D]/8 p-5 transition hover:border-[#203524]/40">
            <code className="mono text-sm font-medium text-[#203524]">λ {l.n}</code>
            <p className="mt-2 text-sm leading-relaxed text-[#11110D]/70">{l.d}</p>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-[#11110D]/55">No functions match "{q}". <button className="underline" onClick={() => setQ("")}>Clear filter</button></p>}
      </div>
    </div>
  );
}

export default function Architecture() {
  const [, navigate] = useLocation();
  useEffect(() => {
    const redirectMovedSection = () => {
      const hash = window.location.hash;
      if (hash === "#journey") {
        navigate("/#how-it-works", { replace: true });
        return;
      }
      if (hash === "#ai-suggestions" || hash === "#collaboration") {
        navigate(`/resources${hash}`, { replace: true });
      }
    };
    redirectMovedSection();
    window.addEventListener("hashchange", redirectMovedSection);
    return () => window.removeEventListener("hashchange", redirectMovedSection);
  }, [navigate]);

  return (
    <>
      <PageHero eyebrow="Architecture · Interactive explanations" title={<>Two clouds. <span className="serif italic text-[#D1F470]">Connected service paths.</span></>}
        lede="Amazon Connect handles the call and routing. Zendesk Contact Center brings call controls and customer context into the agent workspace. Here is how to explain everything in between.">
        {[["#data-flow", "System + data flow"], ["#components", "Components"]].map(([h, l]) => (
          <a key={h} href={h} className="rounded-full border border-[#F5F5F2]/20 px-4 py-2 text-sm hover:border-[#D1F470] hover:text-[#D1F470]" data-testid={`link-jump-${h.slice(1)}`}>{l}</a>
        ))}
      </PageHero>

      <Section tone="forest">
        <SectionHead id="data-flow" eyebrow="System + data flow" dark title="One connected service architecture" lede="Follow the signals across Zendesk and your AWS environment. Explore the complete architecture, trace a flow, or inspect any component." />
        <SystemDataFlow />
        <p className="mt-8 text-xs text-[#F5F5F2]/50">Conceptual architecture. Confirm deployment-specific services, regions, and integration behavior with current product guidance.</p>
      </Section>

      <Section>
        <SectionHead id="components" eyebrow="Components" title="How the pieces fit together" lede="Each Contact Center environment connects to one Amazon Connect instance and uses supporting services deployed in the customer's AWS account." />
        <div className="mb-8 grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {[["Agent experience", "Zendesk Contact Center app", "Omnichannel inbox, AI tools, dashboards, and agent workflows"], ["Voice + routing", "Amazon Connect", "Calls, chats, queues, contact flows, and routing"], ["Integration layer", "AWS services", "CloudFormation, Lambda, Cognito, and event or streaming connections"]].map(([e, t, d], k) => (
            <div key={t} className="contents">
              <div className={`rounded-3xl p-6 ${k === 0 ? "bg-[#D1F470]" : "bg-[#203524] text-[#F5F5F2]"}`}><div className="eyebrow opacity-60">{e}</div><div className="mt-3 text-lg font-semibold">{t}</div><p className="mt-1 text-sm opacity-70">{d}</p></div>
              {k < 2 && <div className="hidden items-center justify-center text-2xl text-[#203524]/40 md:flex" aria-hidden>↔</div>}
            </div>
          ))}
        </div>
        <div className="mb-8 rounded-3xl border-2 border-[#203524] p-6">
          <div className="eyebrow text-[#203524]">Customer data boundary</div>
          <p className="mt-2 text-lg">Contact Center is deployed in the customer's AWS environment. Zendesk's guide says call recordings, customer information, and other Contact Center data stay in that AWS account.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {CORE_COMPONENTS.map((c, k) => (
            <Reveal key={c.n} delay={k * 0.05} className="rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8] p-7">
              <div className="mono text-sm text-[#203524]/50">{c.n}</div>
              <h3 className="mt-3 text-xl font-semibold">{c.t}</h3>
              <p className="mt-2 leading-relaxed text-[#11110D]/70">{c.d}</p>
              <div className="mt-4 flex flex-wrap gap-2">{c.chips.map((x) => <span key={x} className="rounded-full bg-[#203524]/8 px-3 py-1 text-xs">{x}</span>)}</div>
            </Reveal>
          ))}
        </div>
        <Lambdas />
        <div className="mt-6 flex gap-5 rounded-3xl bg-[#203524] p-7 text-[#F5F5F2]">
          <RefreshCw className="h-6 w-6 shrink-0 text-[#D1F470]" aria-hidden />
          <div><h3 className="text-lg font-semibold">Upgrades use a parallel stack</h3><p className="mt-1 text-[#F5F5F2]/70">Zendesk's guide describes creating a new CloudFormation stack alongside the existing one, switching Contact Center after the new stack is ready, validating it, and then removing the old stack. Keeping the old stack until validation provides a rollback point.</p></div>
        </div>
        <Note>Source: <Ext href={LINKS.components} className="underline">Understanding Contact Center components</Ext>. Exact resources and behavior depend on the deployed version and configuration.</Note>
      </Section>

    </>
  );
}
