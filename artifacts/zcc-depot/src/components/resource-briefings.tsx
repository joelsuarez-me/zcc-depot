import { BookOpen, RefreshCw, ThumbsUp } from "lucide-react";
import { Ext, Note, Reveal, Section, SectionHead } from "@/components/kit";
import { LINKS } from "@/data/content";
import { PresenterOnly } from "@/components/presenter";
import { usePresenterContent } from "@/hooks/use-presenter-content";

export function AgentKnowledgeSection() {
  return (
    <Section id="ai-suggestions" tone="white">
      <SectionHead permalinkId="ai-suggestions" num="05" eyebrow="Agent knowledge" title={<>Live transcript in. <span className="hl">Relevant knowledge out.</span></>}
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

function BriefingBody() {
  const { data, isLoading, isError, refetch } = usePresenterContent();
  if (isLoading) return <div className="space-y-3" aria-busy="true">{[0, 1, 2, 3].map((k) => <div key={k} className="h-14 animate-pulse rounded-2xl bg-[#F5F5F2]/8" />)}</div>;
  if (isError || !data) return <p className="text-sm text-[#F5F5F2]/70">Briefing could not be loaded. <button type="button" className="underline" onClick={() => void refetch()} data-testid="button-briefing-retry">Retry</button></p>;
  const [lead, ...rest] = data.legacy.briefing;
  return (
    <>
      <p className="mb-6 text-lg text-[#F5F5F2]/85">{lead}</p>
      <ol className="grid gap-3 md:grid-cols-2">
        {rest.map((line, k) => <li key={k} className="rounded-2xl border border-[#F5F5F2]/12 p-5 text-sm leading-relaxed text-[#F5F5F2]/80" data-testid={`text-briefing-${k}`}><span className="mono mr-2 text-xs text-[#D1F470]">{String(k + 1).padStart(2, "0")}</span>{line}</li>)}
      </ol>
    </>
  );
}

export function LatestNewsSection() {
  return (
    <PresenterOnly title="Internal briefing">
      <Section tone="ink">
        <SectionHead id="collaboration" eyebrow="Latest news · per internal briefing" dark title={<>Agent-to-Agent collaboration <span className="serif italic text-[#D1F470]">in Amazon Connect</span></>} />
        <BriefingBody />
      </Section>
    </PresenterOnly>
  );
}
