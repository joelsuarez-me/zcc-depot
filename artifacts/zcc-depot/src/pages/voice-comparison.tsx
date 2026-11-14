import { useEffect } from "react";
import { PageHero } from "@/components/kit";
import { COMPARISON_TITLE } from "@/data/voice-comparison";
import { VcHead, VcSection } from "@/components/voice-compare/section-head";
import { Matrix } from "@/components/voice-compare/matrix";
import { FitSelector } from "@/components/voice-compare/fit";
import { Discovery, Executive, Faq, Migration, Sources } from "@/components/voice-compare/blocks";
import "@/components/voice-compare/voice-compare.css";

const title = `${COMPARISON_TITLE} | ZCC Depot`;
const description = "Architect-curated comparison of Zendesk Contact Center and Zendesk Voice: capabilities, fit signals, discovery, migration and official sources.";

function useMeta() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const metadata = [
      ['meta[name="description"]', description],
      ['meta[property="og:title"]', title],
      ['meta[property="og:description"]', description],
      ['meta[name="twitter:title"]', title],
      ['meta[name="twitter:description"]', description],
    ].map(([selector, content]) => {
      const element = document.querySelector<HTMLMetaElement>(selector);
      const previous = element?.getAttribute("content") ?? "";
      element?.setAttribute("content", content);
      return { element, previous };
    });
    return () => {
      document.title = previousTitle;
      metadata.forEach(({ element, previous }) => element?.setAttribute("content", previous));
    };
  }, []);
}

const jump = [["summary", "Summary"], ["capabilities", "Capabilities"], ["fit", "Fit"], ["discovery", "Discovery"], ["migration", "Migration"], ["faq", "FAQ"], ["sources", "Sources"]];

export default function VoiceComparison() {
  useMeta();
  return (
    <div className="vc">
      <PageHero motif="brief" eyebrow="Technical selling · Platform Architects" title={COMPARISON_TITLE}
        lede="Choose the right voice solution without overselling. Fit is decided by operational complexity, not a seat count.">
        <nav aria-label="On this page" className="flex flex-wrap gap-2">
          {jump.map(([id, l]) => <a key={id} href={`#${id}`} className="room-chip" data-testid={`link-jump-${id}`}>{l}</a>)}
        </nav>
      </PageHero>

      <VcSection id="summary">
        <VcHead id="summary" art="brief" eyebrow="Executive summary" title="Two good answers, different questions" lede="Use this framing to open the conversation before any feature detail." />
        <Executive />
      </VcSection>
      <VcSection id="capabilities" tone="soft">
        <VcHead id="capabilities" art="matrix" eyebrow="Side by side" title="Capabilities, with the caveats" lede="Filter by category. Every row ends with what to confirm and the official source." />
        <Matrix />
      </VcSection>
      <VcSection id="fit">
        <VcHead id="fit" art="fit" eyebrow="Fit selector" title="Which conversation fits?" lede="Select the customer needs you have heard. Guidance updates as you go." />
        <FitSelector />
      </VcSection>
      <VcSection id="discovery" tone="soft">
        <VcHead id="discovery" art="discover" eyebrow="Practical discovery" title="Questions worth asking first" lede="Four areas that surface real complexity before a recommendation." />
        <Discovery />
      </VcSection>
      <VcSection id="migration">
        <VcHead id="migration" art="path" eyebrow="Migration considerations" title="Move deliberately" lede="No instant or no-effort migration is promised. Scope each step." />
        <Migration />
      </VcSection>
      <VcSection id="faq" tone="soft">
        <VcHead id="faq" art="faq" eyebrow="FAQ" title="Straight answers to common assumptions" />
        <Faq />
      </VcSection>
      <VcSection id="sources">
        <VcHead id="sources" art="sources" eyebrow="Official sources" title="Verify against current Zendesk documentation" lede="Current official documentation, pricing and the signed agreement govern." />
        <Sources />
        <p className="mt-6 border-l-2 border-[#203524]/30 pl-4 text-xs leading-relaxed text-[#11110D]/65">Synthesized by Zendesk Contact Center Platform Architects. Confirm plan, feature, regional availability and commercial terms with Zendesk before sharing decisions.</p>
      </VcSection>
    </div>
  );
}
