import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowDown, ArrowRight, ArrowUp, Check, Pause, Play, Minus } from "lucide-react";
import { PageHero, Ext } from "@/components/kit";
import { RoomSection, SourceNote, StatusTag } from "@/components/room-kit";
import { LINKS } from "@/data/content";
import {
  SLIDES, CHAPTERS, EVOLUTION, LAYERS, AWS_SERVICES, ANATOMY, SYSFLOW, ROUTE_STEPS,
  ROUTING_CMP, QUEUE_CMP, PLATFORM_TILES, APPS, type Mark,
} from "@/data/how-it-works";
import "@/components/how-it-works.css";

const byId = (id: string) => SLIDES.find((s) => s.id === id)!;
const eb = (id: string) => { const s = byId(id); return `Source slide ${s.n} · ${s.short}`; };

function Wire({ light, v, delay = 0 }: { light?: boolean; v?: boolean; delay?: number }) {
  return <span className={`hiw-wire ${light ? "is-light" : ""} ${v ? "is-v" : ""}`} aria-hidden><i style={{ animationDelay: `${delay}s` }} /></span>;
}
function Wave({ n = 18 }: { n?: number }) {
  return <span className="hiw-wave inline-flex h-6 items-end" aria-hidden>{Array.from({ length: n }, (_, i) => <span key={i} style={{ height: 24, animationDelay: `${(i % 7) * 0.12}s` }} />)}</span>;
}
function MarkCell({ m }: { m: Mark }) {
  return m === "yes"
    ? <span className="hiw-mark yes"><Check className="h-4 w-4" aria-hidden />Marked</span>
    : <span className="hiw-mark blank"><Minus className="h-4 w-4" aria-hidden />Not indicated in source</span>;
}
function SectionArrows({ id }: { id: string }) {
  const i = SLIDES.findIndex((s) => s.id === id);
  const prev = SLIDES[i - 1], next = SLIDES[i + 1];
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
      {prev ? <a href={`#${prev.id}`} className="hiw-btn" data-testid={`link-prev-${id}`}><ArrowUp className="h-4 w-4" aria-hidden />{prev.short}</a> : <span />}
      {next && <a href={`#${next.id}`} className="hiw-btn" data-testid={`link-next-${id}`}>{next.short}<ArrowDown className="h-4 w-4" aria-hidden /></a>}
    </div>
  );
}
function Slide({ id, lede, children, tone }: { id: string; lede?: ReactNode; children: ReactNode; tone?: "panel" }) {
  return (
    <div className="hiw-sec" data-slide={byId(id).n}>
      <RoomSection id={id} eyebrow={eb(id)} title={byId(id).title} lede={lede} tone={tone}>
        {children}
        <SectionArrows id={id} />
      </RoomSection>
    </div>
  );
}
function ChapterTransition({ id, chapter, lede }: { id: string; chapter: number; lede: string }) {
  return (
    <Slide id={id} lede={lede}>
      <div className="hiw-stage is-forest">
        <div className="grid-bg" />
        <div className="relative grid gap-3 md:grid-cols-3">
          {CHAPTERS.map((c, i) => (
            <a key={c.id} href={`#${c.slides[0]}`} className={`rounded-xl border p-4 ${i === chapter ? "border-[#D1F470] bg-[#D1F470]/10" : "border-[#F5F5F2]/15 opacity-60 hover:opacity-100"}`} data-testid={`link-chapter-${id}-${c.id}`}>
              <span className="mono text-[0.7rem] text-[#D1F470]">Chapter {i + 1}{i === chapter ? " · you are here" : ""}</span>
              <span className="mt-1 block text-lg font-semibold">{c.label}</span>
              <span className="mt-1 block text-xs text-[#F5F5F2]/60">{c.slides.length} sections</span>
            </a>
          ))}
        </div>
        <div className="relative mt-4 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#D1F470]" /><Wire /><span className="h-2 w-2 rounded-full bg-[#D1F470]" /></div>
      </div>
    </Slide>
  );
}

export default function ResourceHowItWorks() {
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState("overview");
  const [anat, setAnat] = useState(ANATOMY[0].id);
  const [sys, setSys] = useState(SYSFLOW[0].id);
  const [layer, setLayer] = useState<string | null>(null);
  const [route, setRoute] = useState(0);
  const [cop, setCop] = useState<"during" | "after">("during");
  const [app, setApp] = useState(APPS[0].id);

  useEffect(() => {
    const prevT = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const prevD = meta?.getAttribute("content") ?? null;
    document.title = "How Zendesk Contact Center Works | ZCC Depot";
    meta?.setAttribute("content", "A 22-section technical guide to how Zendesk Contact Center combines Amazon Connect and the Zendesk Resolution Platform. November 2025 reference.");
    return () => { document.title = prevT; if (meta && prevD !== null) meta.setAttribute("content", prevD); };
  }, []);

  useEffect(() => {
    const els = SLIDES.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((es) => { es.forEach((e) => e.isIntersecting && setActive(e.target.id)); }, { rootMargin: "-40% 0px -55% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  const curAnat = ANATOMY.find((a) => a.id === anat)!;
  const curSys = SYSFLOW.find((a) => a.id === sys)!;
  const curApp = APPS.find((a) => a.id === app)!;
  const activeSlide = byId(active);

  return (
    <div className={`hiw ${paused ? "hiw-paused" : ""}`}>
      <PageHero eyebrow="Resources · How it works" title="How Zendesk Contact Center works" lede="Amazon Connect telephony and routing, the Zendesk Resolution Platform on top: 22 sections converted from the November 2025 reference deck.">
        <a href="#contents" className="room-chip" data-testid="link-hero-contents">Guide contents<ArrowDown className="h-3.5 w-3.5" aria-hidden /></a>
        <Link href="/architecture/system-overview" className="room-chip" data-testid="link-hero-system-overview">Detailed system overview<ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
      </PageHero>

      <div className="mx-auto max-w-7xl px-5 pb-16 md:px-8">
        <div className="hiw-bar" role="region" aria-label="Guide controls">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hiw-src" data-testid="text-current-slide">Slide {activeSlide.n} / 22</span>
            <span className="truncate font-semibold">{activeSlide.short}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="hiw-jump">Jump to section</label>
            <select id="hiw-jump" className="hiw-btn" value={active} onChange={(e) => { setActive(e.target.value); document.getElementById(e.target.value)?.scrollIntoView({ behavior: "smooth", block: "start" }); history.replaceState(null, "", `#${e.target.value}`); }} data-testid="select-jump-section">
              {CHAPTERS.map((c) => <optgroup key={c.id} label={c.label}>{c.slides.map((s) => <option key={s} value={s}>{byId(s).n}. {byId(s).short}</option>)}</optgroup>)}
            </select>
            <button type="button" className="hiw-btn" aria-pressed={paused} onClick={() => setPaused((p) => !p)} data-testid="button-toggle-motion">
              {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}{paused ? "Resume motion" : "Pause motion"}
            </button>
          </div>
        </div>

        {/* 1 */}
        <Slide id="overview" lede="A technical walk-through for platform conversations: where Amazon Connect ends, where Zendesk begins, and how a call becomes a resolved ticket.">
          <div className="hiw-stage">
            <div className="grid-bg" />
            <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
              <div><div className="eyebrow text-[#D1F470]">Customer AWS</div><div className="mt-1 text-2xl font-semibold">Amazon Connect</div><p className="mt-1 text-sm text-[#F5F5F2]/65">Telephony, contact flows, queues, Contact Lens.</p></div>
              <div className="relative mx-auto h-32 w-32">
                <div className="hiw-orbit h-32 w-32"><b /></div>
                <div className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D1F470] text-center text-[0.65rem] font-extrabold leading-tight text-[#11110D] hiw-pulse">ZCC</div>
              </div>
              <div className="md:text-right"><div className="eyebrow text-[#D1F470]">Zendesk</div><div className="mt-1 text-2xl font-semibold">Resolution Platform</div><p className="mt-1 text-sm text-[#F5F5F2]/65">Workspace, ticketing, knowledge, Copilot, QA.</p></div>
            </div>
            <div className="relative mt-5 flex flex-wrap items-center gap-2 text-xs text-[#F5F5F2]/60"><span className="hiw-src">Source dated November 2025</span><span>Capabilities, packaging and availability change. Confirm current behavior in Zendesk and AWS documentation.</span></div>
          </div>
        </Slide>

        {/* 2 */}
        <Slide id="contents" lede="Three journeys, every source slide preserved. Select any topic to jump; each section has its own permalink." tone="panel">
          <nav aria-label="How it works contents" className="hiw-toc">
            {CHAPTERS.map((c, ci) => (
              <div key={c.id} className="hiw-toc-col">
                <h3>Chapter {ci + 1} · {c.label}</h3>
                <ol>{c.slides.map((s) => { const x = byId(s); return <li key={s}><a href={`#${s}`} className={active === s ? "is-active" : ""} data-testid={`link-toc-${s}`}><span className="mono">S{x.n}</span>{x.short}</a></li>; })}</ol>
              </div>
            ))}
          </nav>
          <SourceNote>Source contents list: How Zendesk Contact Center works · Zendesk's vision: an AI-powered, unified voice platform · How does it integrate with the Resolution Platform · What Amazon technology does it use.</SourceNote>
        </Slide>

        {/* 3 */}
        <Slide id="technology-evolution" lede="Contact center technology has evolved to integrate with CX stacks. Each layer builds on the one below it.">
          <div className="grid gap-3 lg:grid-cols-3">
            {EVOLUTION.map((e, i) => (
              <div key={e.k} className={`rounded-[1.2rem] p-5 hiw-rise ${e.tone === "ink" ? "bg-[#11110D] text-[#F5F5F2]" : e.tone === "green" ? "bg-[#203524] text-[#F5F5F2]" : "bg-[#D1F470] text-[#11110D]"}`} style={{ animationDelay: `${i * 0.4}s` }}>
                <div className="mono text-[0.68rem] opacity-60">{e.sub}</div>
                <h3 className="mt-1 text-lg font-semibold">{e.k}</h3>
                <ul className="mt-3 grid gap-1 text-sm">{e.items.map((x) => <li key={x} className="flex gap-2"><span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${e.tone === "lime" ? "bg-[#11110D]" : "bg-[#D1F470]"}`} aria-hidden />{x}</li>)}</ul>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#11110D]/60"><span>Traditional CCaaS</span><Wire light /><span>Modern CRM/CEC</span><Wire light delay={1.3} /><span>Voice AI</span></div>
        </Slide>

        {/* 4 */}
        <Slide id="platform-and-aws" lede="How it uses Resolution Platform products and AWS services. Select a layer to focus it; all layers stay readable." tone="panel">
          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Focus a layer">
            <button type="button" className="hiw-btn" aria-pressed={layer === null} onClick={() => setLayer(null)} data-testid="button-layer-all">All layers</button>
            {LAYERS.map((l) => <button key={l.id} type="button" className="hiw-btn" aria-pressed={layer === l.id} onClick={() => setLayer(l.id)} data-testid={`button-layer-${l.id}`}><span className="h-2.5 w-2.5 rounded-full" style={{ background: l.c }} aria-hidden />{l.k}</button>)}
          </div>
          <div className="grid gap-2">
            {LAYERS.map((l) => (
              <div key={l.id} className="hiw-layer transition-opacity" style={{ ["--c" as string]: l.c, opacity: layer && layer !== l.id ? 0.35 : 1 }} data-testid={`layer-${l.id}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-xs font-extrabold uppercase tracking-[0.12em]" style={{ color: l.c }}>{l.k}</h3></div>
                <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {l.groups.map((g) => <div key={g.t}><div className="text-sm font-semibold">{g.t}</div><div className="mt-1">{g.items.map((x) => <span key={x} className="hiw-chip">{x}</span>)}</div></div>)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-[#11110D] px-4 py-3 text-sm text-[#F5F5F2]"><span className="font-semibold text-[#D1F470]">Conversation flow:</span> Amazon Connect contact attributes carry interaction context across the layers, from the contact flow to the ticket.</div>
          <SourceNote>Layer taxonomy from the source. Many items are separate products or add-ons; availability depends on plan, entitlement and region.</SourceNote>
        </Slide>

        {/* 5 */}
        <Slide id="anatomy-of-a-call" lede="Amazon Connect and the broader AWS ecosystem handle the call; the agent works without leaving Zendesk. Select a stage.">
          <div className="hiw-stage">
            <div className="grid-bg" />
            <div className="relative flex flex-col items-stretch gap-2 md:flex-row md:items-center">
              {ANATOMY.map((a, i) => (
                <div key={a.id} className="contents">
                  <button type="button" className="hiw-node is-dark md:max-w-[15rem]" aria-pressed={anat === a.id} onClick={() => setAnat(a.id)} data-testid={`button-anatomy-${a.id}`}>
                    <span className="mono block text-[0.65rem] text-[#D1F470]">{a.side}</span><span className="font-semibold">{a.t}</span>
                    {a.id === "voice" && <span className="mt-2 block"><Wave n={14} /></span>}
                  </button>
                  {i < ANATOMY.length - 1 && <><span className="hidden flex-1 md:flex"><Wire delay={i * 0.8} /></span><span className="flex justify-center md:hidden"><Wire v delay={i * 0.8} /></span></>}
                </div>
              ))}
            </div>
            <div className="relative mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-[#F5F5F2]/15 p-3"><div className="text-xs font-bold text-[#D1F470]">Direct access to AWS services</div><div className="mt-1">{AWS_SERVICES.map((s) => <span key={s} className="hiw-chip is-dark">{s}</span>)}</div></div>
              <div className="rounded-xl border border-[#F5F5F2]/15 p-3"><div className="text-xs font-bold text-[#D1F470]">External systems via Lambda</div><div className="mt-1">{["Internal systems", "Data lake", "CRM", "Other"].map((s) => <span key={s} className="hiw-chip is-dark">{s}</span>)}</div></div>
              <div className="rounded-xl border border-[#F5F5F2]/15 p-3"><div className="text-xs font-bold text-[#D1F470]">Into Zendesk</div><div className="mt-1">{["Contact attributes", "Call transcripts", "Call recordings"].map((s) => <span key={s} className="hiw-chip is-dark">{s}</span>)}</div></div>
            </div>
            <p className="relative mt-4 rounded-xl bg-[#F5F5F2] p-3 text-sm text-[#11110D]" aria-live="polite" data-testid="text-anatomy-detail"><strong>{curAnat.t}.</strong> {curAnat.d}</p>
          </div>
          <SourceNote>The source states PII is stored only in the customer's AWS infrastructure or Zendesk account. Treat that as architectural intent, not a blanket guarantee: external integrations, Lambda targets, retention and permissions also hold data. Recording and transcript availability depend on configuration.</SourceNote>
        </Slide>

        {/* 6 */}
        <Slide id="system-data-flow" lede="Two AWS boundaries, one agent experience. Select a path to read what crosses it." tone="panel">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border-2 border-dashed border-[#3E9B57] bg-[#F3FAF5] p-3">
                <div className="text-xs font-extrabold tracking-wider text-[#1F6B35]">ZENDESK AWS CLOUD</div>
                <div className="mt-2 grid gap-2">
                  <button type="button" className="hiw-node" aria-pressed={sys === "controls"} onClick={() => setSys("controls")} data-testid="button-sys-controls"><span className="font-semibold">Zendesk Contact Center</span><span className="block text-xs text-[#11110D]/60">Agent status sync · Ticket search · Call analysis · Reporting and usage metering</span></button>
                </div>
              </div>
              <div className="rounded-2xl border-2 border-dashed border-[#2B2F36] bg-[#F8F9FA] p-3">
                <div className="text-xs font-extrabold tracking-wider">CUSTOMER AWS CLOUD</div>
                <div className="mt-2 grid gap-2">
                  <button type="button" className="hiw-node" aria-pressed={sys === "lambda"} onClick={() => setSys("lambda")} data-testid="button-sys-lambda"><span className="font-semibold">API Gateway + Lambda</span><span className="block text-xs text-[#11110D]/60">Scoped integration helpers</span></button>
                  <button type="button" className="hiw-node" aria-pressed={sys === "records"} onClick={() => setSys("records")} data-testid="button-sys-records"><span className="font-semibold">Post-call records + reporting Lambda</span><span className="block text-xs text-[#11110D]/60">Logs · Transcript metadata · Contact trace records</span></button>
                  <button type="button" className="hiw-node" aria-pressed={sys === "identity"} onClick={() => setSys("identity")} data-testid="button-sys-identity"><span className="font-semibold">AWS Cognito + Customer Profiles</span><span className="block text-xs text-[#11110D]/60">Agent-credential scoped reads</span></button>
                  <button type="button" className="hiw-node" aria-pressed={sys === "redaction"} onClick={() => setSys("redaction")} data-testid="button-sys-redaction"><span className="font-semibold">Amazon Connect + Contact Lens</span><span className="block text-xs text-[#11110D]/60">PII redaction where enabled</span></button>
                  <button type="button" className="hiw-node" aria-pressed={sys === "external"} onClick={() => setSys("external")} data-testid="button-sys-external"><span className="font-semibold">Lambda to external systems</span><span className="block text-xs text-[#11110D]/60">Internal systems · Data lake · CRM · Other</span></button>
                </div>
              </div>
              <div className="flex items-center gap-2 md:col-span-2 text-xs font-semibold text-[#11110D]/60"><span>Zendesk</span><Wire light /><span>records</span><Wire light delay={1.2} /><span>Customer AWS</span></div>
            </div>
            <div className="hiw-panel" aria-live="polite" data-testid="text-sys-detail">
              <div className="hiw-src">Selected path</div>
              <h3 className="mt-2 text-lg font-semibold">{curSys.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#11110D]/72">{curSys.d}</p>
              <Link href="/architecture/system-overview" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold underline" data-testid="link-sys-full">Open the full interactive diagram<ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </div>
          </div>
          <SourceNote>See <Ext href={LINKS.awsServices} className="underline">About AWS services in Contact Center</Ext> and <Ext href={LINKS.components} className="underline">Understanding Contact Center components</Ext>.</SourceNote>
        </Slide>

        {/* 7 */}
        <Slide id="basic-voice-call" lede="One inbound or outbound call, several cooperating services. Contact Lens is AWS; Voice QA is a separate Zendesk product.">
          <div className="hiw-stage">
            <div className="grid-bg" />
            <div className="relative grid gap-3 md:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-start gap-2"><span className="rounded-full bg-[#D1F470] px-3 py-1 text-xs font-bold text-[#11110D]">Inbound / outbound call</span><Wave /></div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { t: "Amazon Connect", s: "Telephony and contact flows", c: "#F5F5F2" },
                  { t: "Amazon Contact Lens", s: "Call recording and transcription, where configured", c: "#F5F5F2" },
                  { t: "Zendesk Voice AI Agents", s: "Automated voice conversations, where licensed", c: "#C9B3F0" },
                  { t: "Voice Copilot", s: "Uses transcripts: knowledge suggestions, summarization, intelligent triage", c: "#C9B3F0" },
                  { t: "Zendesk Knowledge Base", s: "Source for knowledge suggestions", c: "#9CC8F2" },
                  { t: "Zendesk Ticketing", s: "Call record, summary, triage tags", c: "#A8DDB5" },
                  { t: "Zendesk Voice QA", s: "Separate product analyzing supported recordings", c: "#F2C391" },
                  { t: "Zendesk Contact Center", s: "Agent call controls in Workspace", c: "#D1F470" },
                ].map((n, i) => (
                  <div key={n.t} className="rounded-xl border border-[#F5F5F2]/12 bg-[#1B1C17] p-3 hiw-rise" style={{ animationDelay: `${i * 0.25}s` }}>
                    <div className="h-1 w-8 rounded" style={{ background: n.c }} aria-hidden />
                    <div className="mt-2 font-semibold">{n.t}</div><div className="text-xs text-[#F5F5F2]/60">{n.s}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <SourceNote>Zendesk QA does not inherently require Contact Lens transcription. Each capability depends on configuration, licenses and region.</SourceNote>
        </Slide>

        <ChapterTransition id="aws-chapter" chapter={1} lede="Chapter two: the Amazon services underneath. Connect, its routing model, Contact Lens and Lex." />

        {/* 9 */}
        <Slide id="amazon-connect" lede="What Amazon Connect brings: telephony, IVR and routing, embedded inside Zendesk.">
          <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
            <div className="hiw-stage">
              <div className="grid-bg" />
              <div className="relative grid grid-cols-2 gap-2">
                {["Advanced conversational IVR and routing", "Real-time performance dashboards", "Call transcription and recording", "Outbound campaigns and predictive dialing (optional)", "Access to the wider AWS ecosystem"].map((x, i) => (
                  <div key={x} className={`rounded-xl border border-[#F5F5F2]/15 p-3 text-sm font-semibold hiw-pulse ${i === 4 ? "col-span-2" : ""}`} style={{ animationDelay: `${i * 0.5}s` }}>{x}</div>
                ))}
              </div>
            </div>
            <ul className="grid gap-2">
              {[
                "Design end-to-end service journeys with an advanced IVR builder.",
                "Deliver contact center service by embedding Amazon Connect capabilities inside Zendesk.",
                "Use a broad telephony network. The source cited 40+ providers, 158 inbound and 230+ outbound countries (November 2025 figures, not a current guarantee).",
                "Integrate critical data into contact flows by dipping into external databases and systems.",
                "Leverage the AWS ecosystem; the source cited access to 200 additional AWS features.",
                "Keep PII in customer AWS infrastructure or the Zendesk account by design, subject to integrations and retention you configure.",
              ].map((x) => <li key={x} className="depot-card text-sm leading-relaxed">{x}</li>)}
            </ul>
          </div>
          <div className="mt-3 flex flex-wrap gap-2"><StatusTag s="Config-dependent" /><StatusTag s="Optional" /></div>
        </Slide>

        {/* 10 */}
        <Slide id="routing-and-flows" lede="Amazon Connect's IVR builder designs the end-to-end journey. Step through how a call is shaped." tone="panel">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <ol className="grid gap-2">
              {ROUTE_STEPS.map((s, i) => (
                <li key={s.id}><button type="button" className="hiw-node" aria-pressed={route === i} onClick={() => setRoute(i)} data-testid={`button-route-${s.id}`}><span className="mono text-[0.68rem] text-[#11110D]/45">Step {i + 1}</span><span className="block font-semibold">{s.t}</span></button></li>
              ))}
            </ol>
            <div className="hiw-stage" aria-live="polite">
              <div className="grid-bg" />
              <div className="relative">
                <div className="hiw-src">{ROUTE_STEPS[route].t}</div>
                <p className="mt-3 text-sm leading-relaxed text-[#F5F5F2]/80" data-testid="text-route-detail">{ROUTE_STEPS[route].d}</p>
                <div className="mono mt-4 rounded-lg bg-[#F5F5F2]/8 p-3 text-xs text-[#D1F470]">{ROUTE_STEPS[route].ex}</div>
                <div className="mt-4 flex items-center gap-2">{ROUTE_STEPS.map((_, i) => <span key={i} className="contents"><span className={`h-3 w-3 rounded-full ${i <= route ? "bg-[#D1F470]" : "bg-[#F5F5F2]/20"}`} />{i < ROUTE_STEPS.length - 1 && <Wire delay={i * 0.6} />}</span>)}</div>
                <div className="mt-4 flex gap-2">
                  <button type="button" className="hiw-btn" disabled={route === 0} onClick={() => setRoute((r) => r - 1)} data-testid="button-route-prev">Back</button>
                  <button type="button" className="hiw-btn" disabled={route === ROUTE_STEPS.length - 1} onClick={() => setRoute((r) => r + 1)} data-testid="button-route-next">Next step</button>
                </div>
              </div>
            </div>
          </div>
        </Slide>

        {/* 11 */}
        <Slide id="routing-comparison" lede="Different responsibilities: Connect contact flows shape the call; Zendesk omnichannel routing assigns work. Zendesk routing is not a general IVR builder.">
          <div className="hiw-scroll rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8]">
            <table className="hiw-table" data-testid="table-routing-comparison">
              <thead><tr><th>Feature</th><th>What it means</th><th>Amazon Connect</th><th>Zendesk</th></tr></thead>
              <tbody>{ROUTING_CMP.map((r) => <tr key={r.f}><td className="font-semibold">{r.f}</td><td className="text-[#11110D]/70">{r.desc}</td><td><MarkCell m={r.connect} /></td><td><MarkCell m={r.zendesk} /></td></tr>)}</tbody>
            </table>
          </div>
          <SourceNote>November 2025 source comparison, shown as a dated illustration rather than a current feature inventory. "Not indicated in source" means the slide left the cell blank, not that the capability is unsupported.</SourceNote>
        </Slide>

        {/* 12 */}
        <Slide id="queue-comparison" lede="Connect queues hold live contacts; Zendesk queues organize tickets. The source compares them side by side." tone="panel">
          <div className="hiw-scroll rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8]">
            <table className="hiw-table" data-testid="table-queue-comparison">
              <thead><tr><th>Feature</th><th>What it means</th><th>Amazon Connect</th><th>Zendesk</th></tr></thead>
              <tbody>{QUEUE_CMP.map((r) => <tr key={r.f}><td className="font-semibold">{r.f}</td><td className="text-[#11110D]/70">{r.desc}{r.note && <span className="mt-1 block rounded-md bg-[#E0352B]/8 px-2 py-1 text-xs text-[#9B2019]">{r.note}</span>}</td><td><MarkCell m={r.connect} /></td><td><MarkCell m={r.zendesk} /></td></tr>)}</tbody>
            </table>
          </div>
          <SourceNote>November 2025 marks preserved as given. Blank cells mean not indicated in source. Confirm present-day capabilities in current documentation.</SourceNote>
        </Slide>

        {/* 13 */}
        <Slide id="contact-lens" lede="AWS contact center analytics and quality management. In a configured environment, Zendesk Contact Center relies on it for two things.">
          <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
            <div className="hiw-stage">
              <div className="grid-bg" />
              <div className="relative grid gap-3">
                <div className="flex items-center gap-3"><Wave n={22} /><span className="text-xs text-[#F5F5F2]/60">live call audio</span></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#F5F5F2] p-3 text-[#11110D]"><div className="font-semibold">Call recording</div><p className="mt-1 text-xs text-[#11110D]/70">Stored in Amazon S3 and linked in Zendesk tickets. Zendesk QA can analyze supported recordings.</p></div>
                  <div className="rounded-xl bg-[#D1F470] p-3 text-[#11110D]"><div className="font-semibold">Call transcription</div><p className="mt-1 text-xs text-[#11110D]/70">Used by Voice Copilot for knowledge suggestions, summarization and intelligent triage.</p></div>
                </div>
              </div>
            </div>
            <div className="depot-card">
              <h3 className="font-semibold">Optional, not bundled</h3>
              <p className="mt-1 text-sm text-[#11110D]/70">Customers can separately use Contact Lens GenAI-powered evaluations, contact scoring and supervisor alerts on agent performance.</p>
              <div className="mt-3 flex flex-wrap gap-2"><StatusTag s="Config-dependent" /><StatusTag s="Optional" /></div>
            </div>
          </div>
          <SourceNote>The source says Contact Lens is used "by default". Accurately: recording, transcription and PII redaction depend on the configured environment, entitlement and region.</SourceNote>
        </Slide>

        {/* 14 */}
        <Slide id="amazon-lex" lede="Amazon's natural language understanding service for self-service virtual agents and conversational IVR." tone="panel">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="depot-card"><div className="mono text-xs text-[#11110D]/45">Utterances</div>{["\"I need to change my card\"", "\"update payment details\"", "\"my card expired\""].map((u) => <div key={u} className="mt-2 rounded-lg bg-[#11110D]/5 px-2 py-1 text-sm">{u}</div>)}</div>
            <div className="depot-card flex flex-col justify-center"><div className="mono text-xs text-[#11110D]/45">Intent</div><div className="mt-2 rounded-xl bg-[#11110D] px-3 py-3 font-semibold text-[#D1F470] hiw-pulse">UpdatePaymentMethod</div><div className="mt-3 flex items-center gap-2"><Wire light /></div></div>
            <div className="depot-card"><div className="mono text-xs text-[#11110D]/45">Contact flow</div><p className="mt-2 text-sm">Resolve in self-service, or hand off to the right human agent with the intent set as a contact attribute.</p></div>
          </div>
          <SourceNote>Example intent and utterances are illustrative.</SourceNote>
        </Slide>

        <ChapterTransition id="resolution-chapter" chapter={2} lede="Chapter three: how Contact Center plugs into the Zendesk Resolution Platform, product by product." />

        {/* 16 */}
        <Slide id="resolution-platform" lede="Built on the Resolution Platform, unifying voice, digital, AI and QA in one solution. Each tile links to its section.">
          <div className="hiw-stage">
            <div className="grid-bg" />
            <div className="relative">
              <div className="rounded-xl bg-[#D1F470] px-4 py-2 text-center text-xs font-extrabold tracking-[0.14em] text-[#11110D]">CONTACT CENTER</div>
              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                {PLATFORM_TILES.map((t, i) => <a key={t.id} href={`#${t.href}`} className="rounded-xl border border-[#F5F5F2]/15 p-3 text-sm font-semibold hover:border-[#D1F470] hiw-rise" style={{ animationDelay: `${i * 0.2}s` }} data-testid={`link-platform-${t.id}`}>{t.t}</a>)}
              </div>
              <div className="mt-3 rounded-xl border border-[#F5F5F2]/20 px-4 py-2 text-center text-xs font-extrabold tracking-[0.14em] text-[#F5F5F2]/70">RESOLUTION PLATFORM</div>
            </div>
          </div>
          <SourceNote>A unified workspace does not mean one routing engine across all channels; voice routing runs in Amazon Connect. Products depend on plan and entitlement.</SourceNote>
        </Slide>

        {/* 17 */}
        <Slide id="agent-workspace" lede="Agents handle live calls in the workspace they already know, with enterprise voice and the platform's agent tools." tone="panel">
          <div className="overflow-hidden rounded-2xl border border-[#11110D]/12 bg-[#FBFBF8]">
            <div className="flex items-center justify-between bg-[#11110D] px-4 py-2 text-xs text-[#F5F5F2]"><span className="font-semibold">Agent Workspace (illustrative)</span><span className="flex items-center gap-2"><Wave n={8} />On call</span></div>
            <div className="grid gap-3 p-3 md:grid-cols-3">
              <div className="rounded-xl border border-[#11110D]/10 p-3"><div className="text-xs font-bold text-[#2F6FB0]">Customer context</div><p className="mt-1 text-sm text-[#11110D]/70">Requester, organization, interaction history and displayed contact attributes, so customers do not repeat themselves.</p></div>
              <div className="rounded-xl border border-[#11110D]/10 p-3"><div className="text-xs font-bold text-[#3E9B57]">Zendesk Ticketing</div><p className="mt-1 text-sm text-[#11110D]/70">The call is associated with a ticket: the record for fields, notes, recording links and follow-up.</p></div>
              <div className="rounded-xl border border-[#11110D]/10 p-3"><div className="text-xs font-bold text-[#8457C9]">Voice Copilot</div><p className="mt-1 text-sm text-[#11110D]/70">Where configured, analyzes transcriptions for intent to surface knowledge suggestions, call summaries and intelligent triage.</p></div>
            </div>
          </div>
          <SourceNote>The source repeated recording and transcription text under Customer Context and Ticketing; the roles above summarize each component accurately instead.</SourceNote>
        </Slide>

        {/* 18 */}
        <Slide id="zendesk-knowledge" lede="GenAI made knowledge management critical. Copilot knowledge suggestions draw on Knowledge Graph to surface answers to agents.">
          <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
            <div className="hiw-stage">
              <div className="grid-bg" />
              <div className="relative grid grid-cols-2 gap-2">
                {["Documents", "Knowledge base", "APIs", "Website"].map((s, i) => <div key={s} className="rounded-lg border border-[#F5F5F2]/15 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider hiw-pulse" style={{ animationDelay: `${i * 0.4}s` }}>{s}</div>)}
              </div>
              <div className="relative my-2 flex justify-center"><Wire v /></div>
              <div className="relative rounded-xl bg-[#D1F470] p-3 text-center font-semibold text-[#11110D]">Knowledge Graph</div>
              <div className="relative my-2 flex justify-center"><Wire v delay={1} /></div>
              <div className="relative rounded-xl bg-[#F5F5F2] p-3 text-center text-sm font-semibold text-[#11110D]">Suggestions in the call</div>
            </div>
            <div className="grid gap-2">
              {[
                { t: "Knowledge Graph", d: "Contact centers often keep separate knowledge systems. Knowledge Graph unifies content across the organization, including pre-built connectors." },
                { t: "Knowledge Builder", d: "Articles used for real-time suggestions are often not formatted well for AI. Knowledge Builder automates content creation and improves readiness." },
                { t: "Knowledge suggestions", d: "Agents searching articles mid-call increases handle time. Where configured, suggestions surface relevant content during the call." },
              ].map((x) => <div key={x.t} className="depot-card"><h3 className="font-semibold">{x.t}</h3><p className="mt-1 text-sm text-[#11110D]/70">{x.d}</p></div>)}
            </div>
          </div>
          <SourceNote>See <Ext href={LINKS.aiSuggestions} className="underline">Using real-time AI suggestions in Contact Center</Ext>.</SourceNote>
        </Slide>

        {/* 19 */}
        <Slide id="voice-copilot" lede="Voice Copilot uses Contact Lens transcriptions to understand intent. Toggle between during and after the call." tone="panel">
          <div className="depot-mode is-light mb-3 w-max" role="group" aria-label="Call phase">
            <button type="button" aria-pressed={cop === "during"} className={cop === "during" ? "is-on" : ""} onClick={() => setCop("during")} data-testid="button-copilot-during">During the call</button>
            <button type="button" aria-pressed={cop === "after"} className={cop === "after" ? "is-on" : ""} onClick={() => setCop("after")} data-testid="button-copilot-after">After the call</button>
          </div>
          <div className="hiw-stage" aria-live="polite">
            <div className="grid-bg" />
            {cop === "during" ? (
              <div className="relative grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-xl bg-[#1B1C17] p-3 text-sm"><div className="text-xs text-[#D1F470]">Transcript</div><p className="mt-1">"...the router keeps dropping after the firmware update..."</p></div>
                <Wire />
                <div className="rounded-xl bg-[#F5F5F2] p-3 text-sm text-[#11110D]"><div className="text-xs font-bold">Knowledge suggestion</div><p className="mt-1">Rolling back firmware on supported routers</p></div>
              </div>
            ) : (
              <div className="relative grid gap-2 md:grid-cols-3">
                <div className="rounded-xl bg-[#1B1C17] p-3 text-sm"><div className="text-xs text-[#D1F470]">Recording</div>Stored in Amazon S3, available from the ticket.</div>
                <div className="rounded-xl bg-[#1B1C17] p-3 text-sm"><div className="text-xs text-[#D1F470]">Summarization</div>GenAI summary added as an internal note.</div>
                <div className="rounded-xl bg-[#1B1C17] p-3 text-sm"><div className="text-xs text-[#D1F470]">Intelligent triage</div>Intent and sentiment tags from the transcript.</div>
              </div>
            )}
          </div>
          <SourceNote>Post-call steps are processed asynchronously and can take time to appear. Example transcript is illustrative.</SourceNote>
        </Slide>

        {/* 20 */}
        <Slide id="zendesk-ticketing" lede="Calls use the same ticketing as digital channels: one centralized record per issue with context, transcripts and summaries.">
          <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
            <div className="hiw-panel">
              <div className="flex items-center justify-between text-xs"><span className="font-semibold">Ticket record (illustrative)</span><span className="hiw-src">Voice</span></div>
              <ul className="mt-3 grid gap-2 text-sm">
                {["Call recording link", "Transcript", "Internal note: call summary", "Tags: intent, sentiment", "Macro applied: schedule callback + follow-up email"].map((x, i) => <li key={x} className="flex items-center gap-2 rounded-lg bg-[#11110D]/4 px-3 py-2 hiw-rise" style={{ animationDelay: `${i * 0.3}s` }}><span className="h-2 w-2 rounded-full bg-[#3E9B57]" aria-hidden />{x}</li>)}
              </ul>
            </div>
            <div className="grid gap-2">
              <div className="depot-card"><h3 className="font-semibold">Customer context</h3><p className="mt-1 text-sm text-[#11110D]/70">Interaction history and context so agents handle live calls without making customers repeat themselves.</p></div>
              <div className="depot-card"><h3 className="font-semibold">Macros</h3><p className="mt-1 text-sm text-[#11110D]/70">After-call work such as callbacks, follow-up emails and back-office tasks can be reduced with macros and workflows. The source cited up to 20% of agent time on after-call work, a dated estimate rather than a guaranteed outcome.</p></div>
            </div>
          </div>
        </Slide>

        {/* 21 */}
        <Slide id="voice-qa" lede="Zendesk QA is a separate product. It analyzes supported recorded calls stored in Amazon S3 to monitor performance and quality standards." tone="panel">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
            <div className="hiw-stage">
              <div className="grid-bg" />
              <div className="relative grid gap-2">
                {[{ k: "Greeting and verification", v: 0.82 }, { k: "Empathy", v: 0.64 }, { k: "Custom: refund policy stated", v: 0.71 }].map((r, i) => (
                  <div key={r.k}><div className="flex justify-between text-xs"><span>{r.k}</span><span className="mono text-[#F5F5F2]/50">sample</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-[#F5F5F2]/10"><div className="h-full origin-left rounded-full bg-[#D1F470] hiw-pulse" style={{ transform: `scaleX(${r.v})`, animationDelay: `${i * 0.5}s` }} /></div></div>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <div className="depot-card"><h3 className="font-semibold">AutoQA</h3><p className="mt-1 text-sm text-[#11110D]/70">Replaces manual sampling by automatically scoring the enabled, supported recordings and flagging responses that miss standards.</p></div>
              <div className="depot-card"><h3 className="font-semibold">Custom QA</h3><p className="mt-1 text-sm text-[#11110D]/70">Leaders describe what to look for, uncovering business-specific KPIs beyond CSAT and sentiment.</p></div>
            </div>
          </div>
          <SourceNote>The source claimed AutoQA automates 100% of call scoring. Coverage depends on which recordings are enabled and supported; AI scoring is not a compliance or accuracy guarantee. Scores shown are sample values.</SourceNote>
        </Slide>

        {/* 22 */}
        <Slide id="app-builder" lede="Admins describe an app in plain language; Contact Center uses App Builder the same way as digital channels. Pick an example.">
          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Example apps">
            {APPS.map((a) => <button key={a.id} type="button" className="hiw-btn" aria-pressed={app === a.id} onClick={() => setApp(a.id)} data-testid={`button-app-${a.id}`}>{a.t}</button>)}
          </div>
          <div className="grid gap-3 md:grid-cols-2" aria-live="polite">
            <div className="hiw-stage"><div className="grid-bg" /><div className="relative"><div className="text-xs text-[#D1F470]">Admin prompt</div><p className="mono mt-2 text-sm leading-relaxed" data-testid="text-app-prompt">{curApp.prompt}</p></div></div>
            <ol className="hiw-panel grid gap-2">
              {curApp.steps.map((s, i) => <li key={s} className="flex items-start gap-3 text-sm"><span className="room-index">{i + 1}</span><span className="pt-1">{s}</span></li>)}
            </ol>
          </div>
          <SourceNote>Illustrative workflows. Real apps need approved integrations, permissions and, for actions like refunds, human approval; generated apps should be reviewed and tested before production.</SourceNote>
        </Slide>

        <p className="mt-10 text-xs text-[#11110D]/50">Converted from "How Zendesk Contact Center Works", November 2025. Also see the <Link href="/rooms/architecture-integrations#explorer" className="underline" data-testid="link-arch-explorer">architecture explorer</Link>.</p>
      </div>
    </div>
  );
}
