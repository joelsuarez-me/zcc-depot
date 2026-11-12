import { useEffect, useState } from "react";
import { PageHero, Section, SectionHead, Note } from "@/components/kit";
import { DEMO_NUGGETS, type NuggetId } from "@/data/demo-nuggets";
import { DemoPlayer } from "@/components/demo-nuggets/demo-player";
import { CopilotScene } from "@/components/demo-nuggets/copilot-scene";
import { VoiceAiScene } from "@/components/demo-nuggets/voice-ai-scene";
import { VoiceQaScene } from "@/components/demo-nuggets/voice-qa-scene";
import { NuggetLibrary } from "@/components/demo-nuggets/nugget-library";

const TITLE = "Demo Nuggets | ZCC Depot";
const DESC = "Explore the Demo Nuggets library: animated Voice Copilot, Voice QA and Voice AI Agents simulations with sample data.";

function useMeta() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = TITLE;
    const meta = [
      ['meta[name="description"]', DESC], ['meta[property="og:title"]', TITLE], ['meta[property="og:description"]', DESC],
      ['meta[name="twitter:title"]', TITLE], ['meta[name="twitter:description"]', DESC],
    ].map(([sel, content]) => {
      const el = document.querySelector<HTMLMetaElement>(sel);
      const previous = el?.getAttribute("content") ?? "";
      el?.setAttribute("content", content);
      return { el, previous };
    });
    return () => { document.title = prevTitle; meta.forEach(({ el, previous }) => el?.setAttribute("content", previous)); };
  }, []);
}

export default function DemoNuggets() {
  useMeta();
  const [activeId, setActiveId] = useState<NuggetId | null>(null);
  const [copilot, qa, voice] = DEMO_NUGGETS;

  return (
    <>
      <PageHero motif="flow" eyebrow="Demos · Feature simulations" title={<>Demo <span className="serif italic text-[#D1F470]">Nuggets</span></>}
        lede="Playable illustrations of single features. Visual simulations with sample data: no live Zendesk or Amazon session, audio, or external actions." />
      <Section tone="white" className="[&>.section-body]:!pb-8">
        <SectionHead id="library" eyebrow="Feature library" title="Library"
          lede="Choose a feature, open its demo, and play through an illustrated customer-service moment." />
        <NuggetLibrary nuggets={DEMO_NUGGETS} onSelect={() => setActiveId(null)} />
      </Section>
      <Section tone="paper" className="[&>.section-body]:!pt-10">
        <SectionHead id="voice-copilot" num="01" eyebrow="Voice Copilot" title={<>Knowledge, <span className="hl">mid-call</span>.</>} lede={copilot.description} />
        <DemoPlayer nugget={copilot} activeId={activeId} onActiveChange={setActiveId}>{pb => <CopilotScene pb={pb} />}</DemoPlayer>
        <Note>Illustrative only. Sample customer Terry Silva and number +1 (415) 555-0143 are fictional. Guidance and the source article are sample content; availability depends on your Zendesk plan and configuration.</Note>
      </Section>
      <Section tone="white">
        <SectionHead id="voice-qa" eyebrow="Voice QA" title={<>Every conversation, <span className="hl">a quality insight.</span></>}
          lede={qa.description} />
        <DemoPlayer nugget={qa} activeId={activeId} onActiveChange={setActiveId}>{pb => <VoiceQaScene pb={pb} />}</DemoPlayer>
        <Note>Illustrative sample only, based on the supplied Voice QA reference. No call is recorded or analyzed, no quality score is calculated, and no customer or agent action is taken.</Note>
      </Section>
      <Section tone="ink">
        <SectionHead dark id="voice-ai-agents" num="02" eyebrow="Voice AI Agents" title={<>From request to <span className="serif italic text-[#D1F470]">resolution</span>.</>} lede={voice.description} />
        <DemoPlayer dark nugget={voice} activeId={activeId} onActiveChange={setActiveId}>{pb => <VoiceAiScene pb={pb} />}</DemoPlayer>
        <p className="mt-8 border-l-2 border-[#D1F470]/40 pl-4 text-xs leading-relaxed text-[#F5F5F2]/55">Simulated activity. No replacement, pickup or notification is created or sent. Real actions require integrations configured for your environment.</p>
      </Section>
    </>
  );
}
