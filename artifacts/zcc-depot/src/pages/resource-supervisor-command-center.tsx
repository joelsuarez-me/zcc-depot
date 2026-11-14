import { useEffect, useState } from "react";
import { AlertTriangle, ArrowDown, Gauge as GaugeIcon } from "lucide-react";
import { PageHero } from "@/components/kit";
import { RoomSection } from "@/components/room-kit";
import type { Queue } from "@/lib/supervisor-types";
import { METRIC_NOTES, SUPERVISOR_REVIEW_DATE, SUPERVISOR_SOURCES } from "@/data/supervisor-reference";
import { SupervisorProvider, useSupervisor } from "@/components/supervisor/supervisor-session";
import { Sources, SupervisorPresenterNotes, WhatJustHappened } from "@/components/supervisor/shared";
import { AgentMonitoringPanel, ExecutiveKPIBar, RealTimeQueueDashboard, rangeFilter, type Range } from "@/components/supervisor/CommandCenter";
import { OperationsSimulator, SupervisorAlertCenter, SupervisorInterventionCenter, SimulationControls } from "@/components/supervisor/Operations";
import { AgentOccupancyLab, ContactFlowVisualizer, ServiceLevelExplorer } from "@/components/supervisor/Explorers";
import { HistoricalAnalytics, ReportingArchitectureExplorer, ZendeskSupervisorExperience } from "@/components/supervisor/Insights";
import { LiveWallboard, SupervisorPlaybooks } from "@/components/supervisor/Playbooks";
import "@/components/supervisor/supervisor.css";

const TITLE = "Amazon Connect Supervisor Command Center Experience Lab | ZCC Depot";
const DESC = "A deterministic, fictional supervisor command center: live KPIs, six queues, 24 agents, six crisis scenarios, interventions, service-level and occupancy labs, alerts, wallboard and historical analytics, with verified Amazon Connect documentation.";

function Hero() {
  const { start } = useSupervisor();
  const crisis = () => { start("spike"); document.getElementById("simulator")?.scrollIntoView({ behavior: "smooth" }); };
  return (
    <PageHero eyebrow="Resources · Supervisor Command Center" title="Every queue. Every agent. Every moment." lede="Experience how contact center supervisors gain visibility into live operations, monitor agent performance, identify service-level risks, and take action to maintain exceptional customer experiences.">
      <a href="#command-center" className="room-chip" data-testid="link-hero-launch">Launch Command Center<GaugeIcon className="h-3.5 w-3.5" aria-hidden /></a>
      <a href="#capabilities" className="room-chip" data-testid="link-hero-capabilities">Explore Supervisor Capabilities<ArrowDown className="h-3.5 w-3.5" aria-hidden /></a>
      <button type="button" className="room-chip" onClick={crisis} data-testid="button-hero-crisis">Simulate Operational Crisis<AlertTriangle className="h-3.5 w-3.5" aria-hidden /></button>
    </PageHero>
  );
}

function Body() {
  const [range, setRange] = useState<Range>("30");
  const [custom, setCustom] = useState({ from: 0, to: 30 });
  const [queue, setQueue] = useState<Queue | null>(null);
  const { snap } = useSupervisor();
  const qFilter = rangeFilter(range, snap.clock, custom);
  const rangeLabel = { "15": "15 min", "30": "30 min", "60": "1 hr", today: "today", custom: `min ${custom.from}-${custom.to}` }[range];
  return (
    <div className="sc mx-auto max-w-7xl px-4 pb-28 md:px-8">
      <div className="sc-sticky"><SimulationControls compact /></div>
      <RoomSection id="command-center" eyebrow="Live command center" title="Amazon Connect Supervisor Command Center" lede="One deterministic engine drives every tile, queue, agent, chart and alert on this page. Nothing here connects to AWS.">
        <ExecutiveKPIBar range={range} setRange={setRange} custom={custom} setCustom={setCustom} />
        <div className="mt-4 flex flex-wrap items-center gap-3"><LiveWallboard /><span className="text-xs opacity-70">Large-display mode with queue filter, light/dark theme and Exit control.</span></div>
        <WhatJustHappened />
        <SupervisorPresenterNotes roomId="supervisor-operations" title="Operations presenter notes" />
        <Sources keys={["realtime", "historical", "dashboards", "definitions"]} note={METRIC_NOTES.freshness} />
      </RoomSection>
      <RoomSection id="queues" eyebrow="Queue monitoring" title="Six queues, live depth" lede="Live values (waiting, oldest, agents) are current snapshots. SL, ASA and abandonment use the interval chosen in the KPI bar above. Selecting a queue also filters the agent directory." tone="panel">
        <RealTimeQueueDashboard selected={queue} onSelect={setQueue} filter={qFilter} rangeLabel={rangeLabel} />
      </RoomSection>
      <RoomSection id="agents" eyebrow="Agent monitoring" title="Every agent, every state" lede="Search and filter the roster by queue, team, routing profile, status, channel and duration. Select an agent for the activity timeline.">
        <AgentMonitoringPanel queueFilter={queue} />
        <Sources keys={["agents", "status", "status-change", "agent-status"]} />
      </RoomSection>
      <RoomSection id="simulator" eyebrow="Crisis simulator" title="Contact Center Operations Simulator" lede="Seven reproducible scenarios on a shared clock. Step backward through every tick, action and configuration change." tone="panel">
        <OperationsSimulator />
      </RoomSection>
      <RoomSection id="interventions" eyebrow="Intervention center" title="Take Action. Restore Performance." lede="Eight simulated interventions with eligibility checks and before/after impact. Real equivalents require configuration and permissions.">
        <SupervisorInterventionCenter />
        <Sources keys={["transfers", "permissions", "status"]} note={METRIC_NOTES.actions} />
      </RoomSection>
      <div id="capabilities" />
      <RoomSection id="contact-flow" eyebrow="Contact flow" title="See Every Conversation in Motion." lede="Customer, Amazon Connect, contact flow, queue, agent, resolution. Abandons, callbacks and overflow branch off the queue." tone="panel">
        <ContactFlowVisualizer />
        <Sources keys={["records", "events"]} />
      </RoomSection>
      <RoomSection id="service-level" eyebrow="SLA explorer" title="Understand Service Levels in Real Time." lede="Change threshold, target, volume and capacity. Changes update the shared simulation, not a sandbox.">
        <ServiceLevelExplorer />
        <SupervisorPresenterNotes roomId="supervisor-metrics" title="Metrics presenter notes" />
        <Sources keys={["definitions", "historical"]} />
      </RoomSection>
      <RoomSection id="occupancy" eyebrow="Occupancy lab" title="The Agent Capacity Equation" lede="Agents, handle time, ACW, breaks, arrivals and concurrency, with an illustrative capacity model." tone="panel">
        <AgentOccupancyLab />
        <Sources keys={["definitions"]} note={METRIC_NOTES.limits} />
      </RoomSection>
      <RoomSection id="alerts" eyebrow="Alerts" title="Supervisor Alerts and Threshold Engine" lede="Normal, warning, critical, acknowledged, resolved. Native rules and custom integration patterns are labelled separately.">
        <SupervisorAlertCenter />
        <SupervisorPresenterNotes roomId="supervisor-integrations" title="Integration presenter notes" />
        <Sources keys={["rules", "events", "cloudwatch", "agents"]} />
      </RoomSection>
      <RoomSection id="analytics" eyebrow="Historical analytics" title="From Live Operations to Actionable Insights." lede="Ten analysis views from closed records in the shared simulation. Every chart responds to all six filters." tone="panel">
        <HistoricalAnalytics />
        <Sources keys={["historical", "records", "definitions"]} />
      </RoomSection>
      <RoomSection id="architecture" eyebrow="Reporting architecture" title="From Contact Events to Supervisor Intelligence." lede="Choose an architecture; select a node for its role. Native and custom components are marked.">
        <ReportingArchitectureExplorer Sources={Sources} />
      </RoomSection>
      <RoomSection id="zendesk" eyebrow="Zendesk" title="Supervisor Visibility Meets Zendesk." lede="Nine escalation steps that drive a real contact through the shared simulation." tone="panel">
        <ZendeskSupervisorExperience />
        <Sources keys={["tickets", "transfers"]} />
      </RoomSection>
      <RoomSection id="playbooks" eyebrow="Playbooks" title="What Would You Do?" lede="Eight operational exercises. Each choice runs against the shared engine.">
        <SupervisorPlaybooks />
        <SupervisorPresenterNotes roomId="supervisor-playbooks" title="Playbook presenter notes" />
      </RoomSection>
      <footer id="documentation" className="sc-doc" data-testid="text-documentation-review">
        <p className="font-semibold">Documentation Verified · <time dateTime={SUPERVISOR_REVIEW_DATE}>{SUPERVISOR_REVIEW_DATE}</time></p>
        <p className="mt-2 text-xs opacity-75">Reviewed snapshot of the Amazon Connect Administrator Guide pages linked below, not an automatic freshness claim. {METRIC_NOTES.limits}</p>
        <Sources keys={SUPERVISOR_SOURCES.map((s) => s.id)} />
        <p className="mt-3 text-xs opacity-75">All agents, contacts, tickets, metrics and alerts are fictional. The page never calls AWS or Zendesk. State is in memory and resets on reload.</p>
      </footer>
    </div>
  );
}

export default function ResourceSupervisorCommandCenter() {
  useEffect(() => {
    const prev = document.title; document.title = TITLE;
    const meta = [['meta[name="description"]', DESC], ['meta[property="og:title"]', TITLE], ['meta[property="og:description"]', DESC], ['meta[name="twitter:title"]', TITLE], ['meta[name="twitter:description"]', DESC]].map(([s, c]) => { const el = document.querySelector<HTMLMetaElement>(s); const p = el?.getAttribute("content") ?? ""; el?.setAttribute("content", c); return { el, p }; });
    return () => { document.title = prev; meta.forEach(({ el, p }) => el?.setAttribute("content", p)); };
  }, []);
  return (
    <SupervisorProvider>
      <div className="sc-page"><Hero /><Body /></div>
    </SupervisorProvider>
  );
}
