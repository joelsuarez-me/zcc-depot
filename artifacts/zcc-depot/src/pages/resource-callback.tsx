import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, PhoneIncoming } from "lucide-react";
import { PageHero } from "@/components/kit";
import { RoomSection, SourceNote } from "@/components/room-kit";
import { DEFAULT_CONFIG, simulateCallback, advancePlayback, type CbConfig, type Playback, type PlaybackAction, type ScenarioId } from "@/lib/callback-engine";
import { SCENARIOS, scenarioById, DOCS } from "@/data/callback-scenarios";
import { CallbackDiagram } from "@/components/callback/CallbackDiagram";
import { CallbackControls } from "@/components/callback/CallbackControls";
import { CallbackGallery } from "@/components/callback/CallbackGallery";
import { CallbackConfigPanel } from "@/components/callback/CallbackConfigPanel";
import { CallbackCustomerPanel, CallbackAgentPanel, CallbackLifecycleTimeline, CallbackExecutionLog, CallbackOutcomePanel, WhatJustHappened } from "@/components/callback/CallbackPanels";
import { CallbackCommandCenter } from "@/components/callback/CallbackCommandCenter";
import { CallbackArchitectureExplorer } from "@/components/callback/CallbackArchitectureExplorer";
import { CallbackValue } from "@/components/callback/CallbackValue";
import { CallbackConfigGuide } from "@/components/callback/CallbackConfigGuide";
import { CallbackPresenterNotes } from "@/components/callback/CallbackPresenterNotes";
import "@/components/routing/routing.css";
import "@/components/callback/callback.css";

const cfgFor = (id: ScenarioId): CbConfig => ({ ...DEFAULT_CONFIG, ...scenarioById(id)!.defaults });
const fromHash = (): ScenarioId | null => { const h = window.location.hash.replace("#experience-", ""); return scenarioById(h) ? (h as ScenarioId) : null; };

export default function ResourceCallback() {
  const [id, setId] = useState<ScenarioId>(() => fromHash() ?? "queued");
  const [config, setConfig] = useState<CbConfig>(() => cfgFor(fromHash() ?? "queued"));
  const [pb, setPb] = useState<Playback>({ index: 0, running: false });
  const [speed, setSpeed] = useState(1);
  const [still, setStill] = useState(false);
  const sc = scenarioById(id)!;
  const result = useMemo(() => simulateCallback(id, config), [id, config]);
  const len = result.events.length;

  useEffect(() => {
    const prevT = document.title; const meta = document.querySelector('meta[name="description"]'); const prevD = meta?.getAttribute("content") ?? null;
    document.title = "Amazon Connect Callback Experience Lab | ZCC Depot";
    meta?.setAttribute("content", "Interactive, deterministic simulations of twelve Amazon Connect callback experiences: queued, agent-first, customer-first, web, scheduled, external-system and AI-assisted callbacks. Illustrative only.");
    return () => { document.title = prevT; if (meta && prevD !== null) meta.setAttribute("content", prevD); };
  }, []);

  const pick = useCallback((next: string, scroll = true) => {
    if (!scenarioById(next)) return;
    setId(next as ScenarioId); setConfig(cfgFor(next as ScenarioId)); setPb({ index: 0, running: false });
    history.replaceState(null, "", `#experience-${next}`);
    if (scroll) document.getElementById("simulator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const on = () => { const m = fromHash(); if (m) pick(m, true); };
    if (fromHash()) setTimeout(() => document.getElementById("simulator")?.scrollIntoView({ block: "start" }), 300);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, [pick]);

  useEffect(() => {
    if (!pb.running) return;
    const t = setTimeout(() => setPb((p) => advancePlayback(p, "tick", len)), 1300 / speed);
    return () => clearTimeout(t);
  }, [pb, speed, len]);

  const act = (a: PlaybackAction) => setPb((p) => advancePlayback(p, a, len));
  const change = (patch: Partial<CbConfig>) => { setConfig((c) => ({ ...c, ...patch })); setPb({ index: 0, running: false }); };
  const idx = Math.min(pb.index, len - 1);
  const done = idx === len - 1;

  return (
    <div className="rt cb">
      <PageHero eyebrow="Resources · Callback" title="Your time. Your callback. Your experience." lede="Discover how Amazon Connect transforms traditional hold experiences into intelligent, personalized callback journeys. Explore voice callbacks, web callbacks, scheduled callbacks, courtesy callbacks, external-system-triggered callbacks, and AI-powered callback orchestration.">
        <a href="#experiences" className="room-chip" data-testid="link-hero-experiences">Explore Callback Experiences<ArrowDown className="h-3.5 w-3.5" aria-hidden /></a>
        <a href="#simulator" className="room-chip" data-testid="link-hero-simulator">Launch Callback Simulator<PhoneIncoming className="h-3.5 w-3.5" aria-hidden /></a>
      </PageHero>
      <div className="mx-auto max-w-7xl px-5 pb-28 md:px-8">
        <RoomSection id="command-center" eyebrow="Resources · Callback lab" title={<>Amazon Connect Callback Experience Lab<span className="mt-1 block text-lg font-normal text-[#11110D]/60">Callback command center</span></>} lede="One simulated dataset drives every tile, the funnel, the scheduling timeline and the feed. Filter it and everything moves together.">
          <CallbackCommandCenter />
        </RoomSection>

        <RoomSection id="experiences" eyebrow="Gallery" title="Twelve callback experiences" lede="Each miniature is the scenario's real topology. Select one to load it into the simulator.">
          <CallbackGallery current={id} onPick={(x) => pick(x)} />
        </RoomSection>

        <span id={`experience-${id}`} className="rt-method-anchor" aria-hidden="true" />
        <RoomSection id="simulator" eyebrow={`Simulator · experience ${sc.n} of 12 · ${sc.nature}`} title={sc.title} lede={sc.tagline} tone="panel">
          <CallbackControls idx={idx} len={len} running={pb.running} speed={speed} still={still} scenario={id} onAction={act} onSpeed={setSpeed} onStill={() => setStill((s) => !s)} onScenario={(x) => pick(x, false)} />
          <div className={`mt-4 ${still ? "rt-still" : ""}`}>
            <CallbackDiagram key={id} sc={sc} config={config} result={result} idx={idx} running={pb.running} still={still} />
          </div>
          <div className="mt-3"><WhatJustHappened result={result} idx={idx} /></div>
          <div className="mt-4 grid gap-4 xl:grid-cols-[19rem_1fr]">
            <CallbackConfigPanel sc={sc} config={config} onChange={change} />
            <div className="grid content-start gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <CallbackCustomerPanel sc={sc} config={config} result={result} idx={idx} onSubmit={(p) => { setConfig((c) => ({ ...c, ...p })); setPb({ index: 0, running: true }); }} />
                <CallbackAgentPanel sc={sc} config={config} result={result} idx={idx} />
              </div>
              <CallbackLifecycleTimeline result={result} idx={idx} />
              <div className="grid gap-4 md:grid-cols-2">
                <CallbackExecutionLog result={result} idx={idx} onJump={(i) => setPb({ index: i, running: false })} />
                <CallbackOutcomePanel sc={sc} config={config} result={result} done={done} />
              </div>
            </div>
          </div>
          <div className="mt-4"><CallbackPresenterNotes sc={sc} /></div>
          <div className="mt-4"><CallbackConfigGuide key={sc.id} sc={sc} ns="selected-" /></div>
        </RoomSection>

        <RoomSection id="architecture" eyebrow="Architecture explorer" title="From Request to Reconnection" lede="Customer channels, Amazon Connect, flows, orchestration, AWS services, external systems, the agent and Zendesk Agent Workspace. Switch views to see how each pattern wires together.">
          <CallbackArchitectureExplorer />
        </RoomSection>

        <RoomSection id="value" eyebrow="Business value" title="Stop Making Customers Wait. Start Giving Them Control." tone="panel">
          <CallbackValue />
        </RoomSection>

        <RoomSection id="configure" eyebrow="Reference" title="How to configure in Amazon Connect" lede="Thirteen-part guides for every experience. Native capabilities and custom patterns are labelled.">
          <div className="grid gap-2">{SCENARIOS.map((s) => <CallbackConfigGuide key={s.id} sc={s} />)}</div>
        </RoomSection>

        <RoomSection id="accuracy" eyebrow="Technical ground rules" title="What this lab models" tone="panel">
          <ul className="grid gap-2 text-sm md:grid-cols-2">
            {["Agent-first is the default: an Available agent accepts before the customer is dialed. Rejection reroutes and is not a failed dial attempt.", "Agent-first retries apply to ringing no-answer only: initial attempt plus Max retries, spaced by Minimum time. Voicemail counts as connected.", "A callback is a new contact linked to the original inbound contact; with equal queue priority it keeps the original start time.", "Customer-first runs only on eligible next-generation instances; Check call progress confirms a human after answer before Transfer to queue. C2 has no native max retries.", "StartOutboundVoiceContact is a custom outbound pattern: it dials the customer, then runs your flow. It is not a native queued callback.", "Scheduling, AI, CRM and external-dependency orchestration are custom patterns. EventBridge Scheduler is minute-precise, not second-exact. No Zendesk ticket exists unless an integration is configured."].map((x) => <li key={x} className="depot-card">{x}</li>)}
          </ul>
          <SourceNote>Deterministic teaching model with fictional people and simulated timestamps. No calls, messages or API requests are made. Sources: <a className="underline" href={DOCS.queued.url} target="_blank" rel="noreferrer">{DOCS.queued.label}</a>, <a className="underline" href={DOCS.customerFirst.url} target="_blank" rel="noreferrer">{DOCS.customerFirst.label}</a>, <a className="underline" href={DOCS.failed.url} target="_blank" rel="noreferrer">{DOCS.failed.label}</a>, <a className="underline" href={DOCS.sov.url} target="_blank" rel="noreferrer">{DOCS.sov.label}</a>.</SourceNote>
        </RoomSection>
      </div>
    </div>
  );
}
