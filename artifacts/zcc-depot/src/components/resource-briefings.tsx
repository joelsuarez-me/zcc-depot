
import { Section, SectionHead } from "@/components/kit";
import { PresenterOnly } from "@/components/presenter";
import { usePresenterContent } from "@/hooks/use-presenter-content";


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
