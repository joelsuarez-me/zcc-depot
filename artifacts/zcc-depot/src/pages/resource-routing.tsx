import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, PhoneIncoming } from "lucide-react";
import { PageHero } from "@/components/kit";
import { RoomSection, SourceNote } from "@/components/room-kit";
import { DEFAULT_CONFIG, simulateRouting, advancePlayback, type MethodId, type Playback, type PlaybackAction, type RoutingConfig } from "@/lib/routing-engine";
import { METHODS, methodById, DOCS } from "@/data/routing-scenarios";
import { RoutingDiagram } from "@/components/routing/RoutingDiagram";
import { RoutingMethodGallery, RoutingControls, RoutingConfigurationPanel, AgentEligibilityPanel, RoutingExecutionTimeline, RoutingOutcomePanel, RoutingPresenterNotes, RoutingConfigGuide } from "@/components/routing/RoutingPanels";
import "@/components/routing/routing.css";

const cfgFor = (id: MethodId): RoutingConfig => ({ ...DEFAULT_CONFIG, ...methodById(id)!.defaults });
const fromHash = (): MethodId | null => { const h = window.location.hash.replace("#method-", ""); return methodById(h) ? (h as MethodId) : null; };

export default function ResourceRouting() {
  const [methodId, setMethodId] = useState<MethodId>(() => fromHash() ?? "queue");
  const [config, setConfig] = useState<RoutingConfig>(() => cfgFor(fromHash() ?? "queue"));
  const [pb, setPb] = useState<Playback>({ index: 0, running: false });
  const [speed, setSpeed] = useState(1);
  const [presenter, setPresenter] = useState(false);
  const [still, setStill] = useState(false);
  const method = methodById(methodId)!;
  const result = useMemo(() => simulateRouting(methodId, config), [methodId, config]);
  const len = result.events.length;

  useEffect(() => {
    const prevT = document.title; const meta = document.querySelector('meta[name="description"]'); const prevD = meta?.getAttribute("content") ?? null;
    document.title = "Amazon Connect Routing Experience Lab | ZCC Depot";
    meta?.setAttribute("content", "Interactive, deterministic simulations of twelve Amazon Connect routing methods: queues, routing profiles, proficiency, priority, overflow and more. Illustrative only.");
    return () => { document.title = prevT; if (meta && prevD !== null) meta.setAttribute("content", prevD); };
  }, []);

  const pick = useCallback((id: string, scroll = true) => {
    if (!methodById(id)) return;
    setMethodId(id as MethodId); setConfig(cfgFor(id as MethodId)); setPb({ index: 0, running: false });
    history.replaceState(null, "", `#method-${id}`);
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
    const t = setTimeout(() => setPb((p) => advancePlayback(p, "tick", len)), 1200 / speed);
    return () => clearTimeout(t);
  }, [pb, speed, len]);

  const act = (a: PlaybackAction) => setPb((p) => advancePlayback(p, a, len));
  const change = (k: keyof RoutingConfig, v: string | number | boolean) => { setConfig((c) => ({ ...c, [k]: v })); setPb({ index: 0, running: false }); };
  const idx = Math.min(pb.index, len - 1);
  const done = idx === len - 1;

  return (
    <div className="rt">
      <PageHero eyebrow="Resources · Routing" title="Every call. The right destination. The right agent." lede="Explore how Amazon Connect routes customer conversations using queues, routing profiles, agent availability, skills, customer attributes, priorities and real-time routing decisions.">
        <a href="#methods" className="room-chip" data-testid="link-hero-methods">Explore routing methods<ArrowDown className="h-3.5 w-3.5" aria-hidden /></a>
        <a href="#simulator" className="room-chip" data-testid="link-hero-simulator">Launch routing simulator<PhoneIncoming className="h-3.5 w-3.5" aria-hidden /></a>
      </PageHero>
      <div className="mx-auto max-w-7xl px-5 pb-28 md:px-8">
        <RoomSection id="methods" eyebrow="Resources · Routing lab" title={<>Amazon Connect Routing Experience Lab<span className="mt-1 block text-lg font-normal text-[#11110D]/60">Twelve routing methods</span></>} lede="Each method has its own scenario, diagram topology and decision branches. Select one to load it into the simulator.">
          <RoutingMethodGallery current={methodId} onPick={(id) => pick(id)} />
        </RoomSection>

        <span id={`method-${methodId}`} className="rt-method-anchor" aria-hidden="true" />
        <RoomSection id="simulator" eyebrow={`Simulator · method ${method.n} of 12`} title={method.title} lede={method.tagline} tone="panel">
          <RoutingControls idx={idx} len={len} running={pb.running} speed={speed} presenter={presenter} still={still} onAction={act} onSpeed={setSpeed} onPresenter={() => setPresenter((p) => !p)} onStill={() => setStill((s) => !s)} />
          <div className={`mt-4 grid gap-4 lg:grid-cols-[17rem_1fr] ${still ? "rt-still" : ""}`}>
            <RoutingConfigurationPanel method={method} config={config} onChange={change} />
            <RoutingDiagram key={methodId} method={method} config={config} result={result} idx={idx} running={pb.running} still={still} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <AgentEligibilityPanel result={result} idx={idx} config={config} />
            <RoutingExecutionTimeline result={result} idx={idx} onJump={(i) => setPb({ index: i, running: false })} />
          </div>
          <div className="mt-4"><RoutingOutcomePanel result={result} done={done} /></div>
          {presenter && <div className="mt-4"><RoutingPresenterNotes method={method} result={result} /></div>}
          <div className="mt-4"><RoutingConfigGuide key={method.id} method={method} ns="selected-" /></div>
        </RoomSection>

        <RoomSection id="configure" eyebrow="Reference" title="How to configure in Amazon Connect" lede="Eight-part guides for every method. Native features and custom patterns are labelled.">
          <div className="grid gap-2">{METHODS.map((m) => <RoutingConfigGuide key={m.id} method={m} />)}</div>
        </RoomSection>

        <RoomSection id="accuracy" eyebrow="Technical ground rules" title="What this lab models" tone="panel">
          <ul className="grid gap-2 text-sm md:grid-cols-2">
            {["Queues hold waiting contacts; routing profiles connect agents to queues and channels.", "Priority and delay are set per queue in a routing profile. Lower number wins; equal priority takes the oldest contact. Delay counts contact wait time.", "Agent selection: fewest active contacts across channels, then longest Available.", "Proficiency steps expire only into explicitly configured next steps.", "Intent is classified by Amazon Lex; the flow branches on its output.", "Overflow, hours and Lambda lookups are explicit flow logic with error branches."].map((x) => <li key={x} className="depot-card">{x}</li>)}
          </ul>
          <SourceNote>Deterministic teaching model with no live AWS connection. Sources: <a className="underline" href={DOCS.about.url} target="_blank" rel="noreferrer">{DOCS.about.label}</a>, <a className="underline" href={DOCS.priority.url} target="_blank" rel="noreferrer">{DOCS.priority.label}</a>.</SourceNote>
        </RoomSection>
      </div>
    </div>
  );
}
