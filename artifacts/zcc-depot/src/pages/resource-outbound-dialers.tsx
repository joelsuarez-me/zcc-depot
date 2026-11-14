import { useCallback, useEffect, useState } from "react";
import { ArrowDown, Gauge, Rocket } from "lucide-react";
import { PageHero } from "@/components/kit";
import { RoomSection } from "@/components/room-kit";
import type { DialMode } from "@/lib/outbound-dialer";
import { OutboundDialerLab } from "@/components/outbound/OutboundDialerLab";
import { OutboundComparison } from "@/components/outbound/OutboundComparison";
import { OutboundCampaignBuilder } from "@/components/outbound/OutboundCampaignBuilder";
import { OutboundSegmentation } from "@/components/outbound/OutboundSegmentation";
import { OutboundSuppression } from "@/components/outbound/OutboundSuppression";
import { OutboundCompliance } from "@/components/outbound/OutboundCompliance";
import { OutboundTimeZones } from "@/components/outbound/OutboundTimeZones";
import { OutboundCommandCenter } from "@/components/outbound/OutboundCommandCenter";
import { OutboundJourney, OutboundServices } from "@/components/outbound/OutboundMultichannel";
import { OutboundAmd } from "@/components/outbound/OutboundAmd";
import { OutboundIndustries, OutboundReporting, OutboundZendesk } from "@/components/outbound/OutboundExplainers";
import { OutboundPresenterNotes } from "@/components/outbound/OutboundPresenterNotes";
import { Sources } from "@/components/outbound/OutboundShared";
import { REVIEW_DATE } from "@/data/outbound-content";
import "@/components/routing/routing.css";
import "@/components/outbound/outbound.css";

const TITLE = "Amazon Connect Outbound Dialers Experience Lab | ZCC Depot";
const DESC = "Interactive, fictional simulations of Amazon Connect outbound campaigns: predictive, progressive, preview and agentless dialing, segmentation, suppression, compliance-aware windows, multichannel journeys and a campaign command center.";
const MODES: DialMode[] = ["predictive", "progressive", "preview", "agentless"];
const fromHash = (): DialMode | null => { const h = window.location.hash.replace("#dialer-", ""); return MODES.includes(h as DialMode) ? (h as DialMode) : null; };

export default function ResourceOutboundDialers() {
  const [mode, setMode] = useState<DialMode>(() => fromHash() ?? "predictive");
  useEffect(() => {
    const prev = document.title; document.title = TITLE;
    const meta = [['meta[name="description"]', DESC], ['meta[property="og:title"]', TITLE], ['meta[property="og:description"]', DESC], ['meta[name="twitter:title"]', TITLE], ['meta[name="twitter:description"]', DESC]].map(([s, c]) => { const el = document.querySelector<HTMLMetaElement>(s); const p = el?.getAttribute("content") ?? ""; el?.setAttribute("content", c); return { el, p }; });
    return () => { document.title = prev; meta.forEach(({ el, p }) => el?.setAttribute("content", p)); };
  }, []);
  const open = useCallback((m: DialMode) => { setMode(m); history.replaceState(null, "", `#dialer-${m}`); document.getElementById("dialing-modes")?.scrollIntoView({ behavior: "smooth", block: "start" }); }, []);
  useEffect(() => { const on = () => { const m = fromHash(); if (m) setMode(m); }; window.addEventListener("hashchange", on); return () => window.removeEventListener("hashchange", on); }, []);
  return (
    <div className="rt ob">
      <PageHero eyebrow="Resources · Outbound Dialers" title="Every outreach. Perfectly orchestrated." lede="Explore how Amazon Connect transforms outbound engagement through intelligent dialing, personalized campaigns, customer segmentation, compliance-aware communication controls, and coordinated voice and digital experiences.">
        <a href="#dialing-modes" className="room-chip" data-testid="link-hero-modes">Explore Dialing Modes<ArrowDown className="h-3.5 w-3.5" aria-hidden /></a>
        <a href="#campaign-builder" className="room-chip" data-testid="link-hero-simulator">Launch Campaign Simulator<Rocket className="h-3.5 w-3.5" aria-hidden /></a>
        <a href="#command-center" className="room-chip" data-testid="link-hero-command-center">Open Campaign Command Center<Gauge className="h-3.5 w-3.5" aria-hidden /></a>
      </PageHero>
      <div className="mx-auto max-w-7xl px-5 pb-28 md:px-8">
        <RoomSection id="dialing-modes" eyebrow="Dialing modes" title="Four ways to start a conversation" lede="Each simulator runs on a deterministic, fictional engine with synchronized agents, lifecycle, log and outcomes. Shared suppression removes ineligible contacts before any dial.">
          <OutboundDialerLab mode={mode} onMode={open} />
          <Sources keys={["best", "guided", "ccp", "preview"]} note="Pacing math is illustrative; the predictive algorithm is service-managed." />
        </RoomSection>
        <RoomSection id="compare" eyebrow="Comparison" title="Ten dimensions, one decision" lede="Highlight a dimension, then answer six questions. The recommendation is architectural guidance, not an AWS guarantee." tone="panel">
          <OutboundComparison onOpen={open} />
        </RoomSection>
        <RoomSection id="campaign-builder" eyebrow="Campaign simulator" title="Build a campaign in seven steps" lede="Validation mirrors the guided builder's required fields. The lifecycle is a demonstration; no AWS resources are created.">
          <OutboundCampaignBuilder />
          <OutboundPresenterNotes roomId="outbound-campaigns" title="Campaign presenter notes" />
          <Sources keys={["create", "guided", "editing", "enable"]} />
        </RoomSection>
        <RoomSection id="segmentation" eyebrow="Segmentation lab" title="Ten thousand profiles, filtered live" lede="Stack criteria, watch the funnel and sort a voice segment by up to ten attributes." tone="panel">
          <OutboundSegmentation />
        </RoomSection>
        <RoomSection id="suppression" eyebrow="Suppression center" title="One list. Every channel. Full audit." lede="Entries here feed segment eligibility, compliance gates and every dialer simulator.">
          <OutboundSuppression />
        </RoomSection>
        <RoomSection id="compliance" eyebrow="Compliance lab" title="Gates before the dial" lede="Five fictional contacts, six gates, three independent regulatory review prompts." tone="panel">
          <OutboundCompliance />
          <OutboundPresenterNotes roomId="outbound-compliance" title="Compliance presenter notes" />
          <Sources keys={["fcc", "ftc", "best"]} />
        </RoomSection>
        <RoomSection id="time-zones" eyebrow="Time zones" title="Six US zones, one campaign clock" lede="IANA zones with DST via Intl. Customers with several contacts must fit every detected zone; unresolvable zones are excluded.">
          <OutboundTimeZones />
          <Sources keys={["history", "best"]} note="The multi-contact time-zone enhancement was documented May 18, 2026. Regional windows and blackouts in this lab are illustrative organization policies." />
        </RoomSection>
        <RoomSection id="command-center" eyebrow="Command center" title="Campaign Command Center" lede="Thirteen KPIs, eight charts and nine filters from one fictional dataset. Export CSV or preview a simulated notification." tone="panel">
          <OutboundCommandCenter />
          <OutboundPresenterNotes roomId="outbound-analytics" title="Analytics presenter notes" />
          <Sources keys={["dashboard", "metrics"]} />
        </RoomSection>
        <RoomSection id="multichannel" eyebrow="Multichannel" title="Voice and digital, one journey" lede="Reorder blocks by drag or keyboard, choose fallbacks and run the journey against a customer scenario.">
          <OutboundJourney />
          <div className="mt-6"><OutboundServices /></div>
          <OutboundPresenterNotes roomId="outbound-multichannel" title="Multichannel presenter notes" />
          <Sources keys={["journey", "send", "pinpoint", "legacy"]} />
        </RoomSection>
        <RoomSection id="answer-detection" eyebrow="Answer detection" title="Seven outcomes, two places they happen" lede="Busy, no answer and failure occur before the classifier. Check call progress only branches once media exists, and is not supported for preview." tone="panel">
          <OutboundAmd />
          <Sources keys={["ccp", "best"]} />
        </RoomSection>
        <RoomSection id="reporting" eyebrow="Reporting" title="Native reporting, custom analytics" lede="Select a node to see where each number comes from.">
          <details open><summary className="mb-4 cursor-pointer text-sm font-semibold">Explore the reporting architecture and data sources</summary><OutboundReporting /></details>
          <Sources keys={["dashboard", "metrics", "regions"]} />
        </RoomSection>
        <RoomSection id="zendesk" eyebrow="Zendesk" title="Preview outreach in the agent workspace" lede="Nine conceptual steps. Native, configuration-dependent and custom pieces are labelled." tone="panel">
          <OutboundZendesk />
          <Sources keys={["guided", "best"]} note="Sources establish the Amazon Connect campaign behavior. The illustrated Zendesk UI is conceptual and requires separate integration validation." />
        </RoomSection>
        <RoomSection id="industries" eyebrow="Industry gallery" title="Seven industries, twenty-one outreach patterns">
          <OutboundIndustries onOpen={open} />
          <Sources keys={["best", "history"]} note="Illustrative patterns with fictional outcomes." />
        </RoomSection>
        <footer id="documentation" className="mt-8 rounded-2xl border border-[var(--line)] bg-white/50 p-5 text-sm" data-testid="text-documentation-review">
          <p className="font-semibold">Documentation Verified · <time dateTime={REVIEW_DATE}>{REVIEW_DATE}</time></p>
          <p className="mt-2 text-xs opacity-75">Last successful review of the linked AWS Administrator Guide, service documentation and FCC/FTC guidance. This date is a reviewed snapshot, not an automatic freshness claim. Regional availability, account prerequisites and legal obligations must be checked for each deployment.</p>
          <Sources keys={["enable", "best", "create", "guided", "journey", "dashboard", "metrics", "editing", "history", "fcc", "ftc"]} />
          <p className="mt-3 text-xs opacity-75">All records, dialing, messages, notifications and dashboard metrics are fictional. Consent-system lookups, DNC ingestion, CRM writeback, custom analytics and Zendesk campaign UI extensions require separately validated integrations. Lab changes remain in memory and reset on reload.</p>
        </footer>
      </div>
    </div>
  );
}
