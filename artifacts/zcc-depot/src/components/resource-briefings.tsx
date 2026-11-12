import { BookOpen, RefreshCw, ThumbsUp } from "lucide-react";
import { Ext, Note, Reveal, Section, SectionHead } from "@/components/kit";
import { LINKS } from "@/data/content";

export function AgentKnowledgeSection() {
  return (
    <Section tone="white">
      <SectionHead id="ai-suggestions" num="05" eyebrow="Agent knowledge" title={<>Live transcript in. <span className="hl">Relevant knowledge out.</span></>}
        lede="Give agents call-specific guidance from your Zendesk help center while a customer conversation is still in progress." />
      <div className="grid gap-6 lg:grid-cols-12">
        <Reveal className="rounded-[2rem] bg-[#203524] p-8 text-[#F5F5F2] lg:col-span-5">
          <div className="eyebrow text-[#D1F470]">Prerequisites</div>
          <ul className="mt-5 space-y-4">
            {["Live voice transcripts enabled in Contact Center", "Zendesk Copilot available on the account", "A help center that covers the topics customers call about"].map((p) => (
              <li key={p} className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm bg-[#D1F470]" />{p}</li>
            ))}
          </ul>
          <p className="mt-8 text-sm leading-relaxed text-[#F5F5F2]/70">Generative AI analyzes the live transcript, identifies the customer's reason for calling, and searches the help center. Suggested answers appear in the Knowledge tab, supported by one or more relevant articles.</p>
          <div className="mono mt-6 flex flex-wrap items-center gap-2 text-xs text-[#D1F470]"><span>Live call transcript</span>→<span>AI finds guidance</span>→<span>Knowledge panel</span></div>
        </Reveal>
        <div className="grid gap-4 lg:col-span-7">
          {[[BookOpen, "Open suggestions", "During an active phone conversation in Agent Workspace, select View knowledge suggestions in the ticket. Suggestions open in the Knowledge panel."], [ThumbsUp, "Review and give feedback", "Mark a suggestion Helpful or Not helpful based on its accuracy and relevance. Feedback may inform future model improvements, which might not appear immediately."], [RefreshCw, "Regenerate as the call changes", "If the customer changes topics or the conversation takes a new direction, select Regenerate to request updated suggestions."]].map(([I, t, d], k) => {
            const Icon = I as typeof BookOpen;
            return (
              <Reveal key={t as string} delay={k * 0.07} className="flex gap-5 rounded-3xl border border-[#11110D]/10 p-6 transition hover:border-[#203524]/40">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#D1F470]"><Icon className="h-5 w-5" /></span>
                <div><div className="mono text-xs text-[#11110D]/45">0{k + 1}</div><h3 className="text-lg font-semibold">{t as string}</h3><p className="mt-1 text-[#11110D]/65">{d as string}</p></div>
              </Reveal>
            );
          })}
          <div className="rounded-3xl border-2 border-dashed border-[#203524]/25 p-6">
            <h3 className="font-semibold">Prepare your help center for better suggestions</h3>
            <p className="mt-1 text-[#11110D]/65">Make sure your help center covers the common topics customers call about. If the source articles are missing or out of date, AI suggestions may not be useful to agents.</p>
          </div>
        </div>
      </div>
      <Note>Based on <Ext href={LINKS.aiSuggestions} className="underline">Using real-time AI suggestions in Contact Center</Ext>. Requires live voice transcripts and Zendesk Copilot; availability depends on account configuration.</Note>
    </Section>
  );
}

export function LatestNewsSection() {
  return (
    <Section tone="ink">
      <SectionHead id="collaboration" num="06" eyebrow="Latest news · per internal briefing" dark title={<>Agent-to-Agent collaboration <span className="serif italic text-[#D1F470]">in Amazon Connect</span></>}
        lede="Per the source briefing, AWS launched A2A collaboration (GA, Customer tier), bringing specialist AI agents into live customer contacts under a Connect orchestrator." />
      <p className="mb-8 rounded-2xl border border-[#D1F470]/30 p-4 text-sm text-[#F5F5F2]/75"><strong className="text-[#D1F470]">Terminology:</strong> A2A here means AI-agent collaboration, not a human agent-to-agent transfer. Connect adds voice streaming, session continuity, and built-in observability to the open A2A protocol.</p>
      <div className="grid gap-3 md:grid-cols-4">
        {[["Live contact", "Customer calls Amazon Connect"], ["Connect AI orchestrator", "Chooses whether and when to involve a specialist"], ["Specialist collaborator", "Connect, Bedrock AgentCore, or a compliant external agent"], ["Resolution path", "Return to orchestrator or escalate through the contact flow"]].map(([t, d], k) => (
          <div key={t} className="relative rounded-2xl border border-[#F5F5F2]/12 p-5"><div className="mono text-xs text-[#D1F470]">0{k + 1}</div><div className="mt-2 font-semibold">{t}</div><p className="mt-1 text-sm text-[#F5F5F2]/60">{d}</p></div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {[["Mode 01", "Delegate behind the scenes", "The orchestrator stays with the customer while a specialist handles a focused task, such as a fraud risk assessment, then returns a result."], ["Mode 02", "Hand off to a specialist", "The collaborator speaks with the customer for a multi-turn task, then returns control with a completion or escalation outcome."]].map(([m, t, d]) => (
          <div key={m} className="rounded-3xl bg-[#203524] p-7"><div className="eyebrow text-[#D1F470]">{m}</div><h3 className="mt-3 text-xl font-semibold">{t}</h3><p className="mt-2 text-[#F5F5F2]/70">{d}</p></div>
        ))}
      </div>
      <div className="mt-8 rounded-3xl bg-[#F5F5F2] p-7 text-[#11110D]">
        <div className="eyebrow text-[#203524]">What it means for Zendesk Contact Center</div>
        <p className="mt-3 text-lg">ZCC runs on Amazon Connect, so A2A could fit its voice foundation. Open design questions: account tier, API configuration ownership, context transfer, reporting, and commercial model.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[["Availability", "Confirm Connect Customer tier eligibility and regional rollout."], ["Orchestration", "Decide which agent leads and whether Zendesk AI or Forethought should be explored as a collaborator."], ["Context + controls", "Design ticket-data access, trace reporting, human escalation, and combined AI-cost visibility."]].map(([t, d]) => <div key={t} className="rounded-2xl border border-[#11110D]/10 p-4"><div className="font-semibold">{t}</div><p className="mt-1 text-sm text-[#11110D]/65">{d}</p></div>)}
        </div>
      </div>
      <p className="mt-6 text-xs text-[#F5F5F2]/50">Based on an internal A2A briefing; dates and tiers as stated there. Zendesk AI and Forethought collaborator paths require product and technical validation and are not presented as current integrations.</p>
    </Section>
  );
}
