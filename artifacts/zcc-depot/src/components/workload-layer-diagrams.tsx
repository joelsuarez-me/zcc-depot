import { BarChart3, Headphones, Laptop, Phone, Route } from "lucide-react";
import type { ReactNode } from "react";

const ink = "#203524";
const lime = "#C4F36B";
const cyan = "#61D4E2";
const violet = "#AA91F6";
const amber = "#E9B45D";

function Label({ x, y, children, size = 13, color = "#203524", weight = 600, anchor = "middle" }: { x: number; y: number; children: string; size?: number; color?: string; weight?: number; anchor?: "start" | "middle" | "end" }) {
  return <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={size} fontWeight={weight}>{children}</text>;
}

function Node({ x, y, w = 150, h = 76, color = lime, title, detail, icon = "cloud" }: { x: number; y: number; w?: number; h?: number; color?: string; title: string; detail?: string; icon?: "cloud" | "phone" | "network" | "server" | "agent" | "data" }) {
  const cx = x + 26;
  const cy = y + h / 2;
  return <g>
    <rect x={x} y={y} width={w} height={h} rx="18" fill="#fff" stroke={color} strokeWidth="1.7" />
    <circle cx={cx} cy={cy} r="15" fill={color} opacity=".18" />
    {icon === "phone" && <path d={`M${cx-5} ${cy-8}c-2 0-3 2-2 4 2 5 5 8 10 10 2 1 4-1 4-3l-4-3-3 2c-2-1-3-2-4-4l2-3z`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
    {icon === "network" && <g stroke={color} strokeWidth="2" strokeLinecap="round"><path d={`M${cx-9} ${cy}h18M${cx-6} ${cy-6}v12M${cx} ${cy-9}v18M${cx+6} ${cy-4}v8`} /></g>}
    {icon === "server" && <g fill="none" stroke={color} strokeWidth="1.7"><rect x={cx-8} y={cy-9} width="16" height="18" rx="3"/><path d={`M${cx-4} ${cy-4}h8M${cx-4} ${cy+1}h8`} /></g>}
    {icon === "agent" && <g fill="none" stroke={color} strokeWidth="1.8"><rect x={cx-9} y={cy-8} width="18" height="13" rx="2"/><path d={`M${cx-4} ${cy+8}h8M${cx} ${cy+5}v3`} /></g>}
    {icon === "data" && <g fill="none" stroke={color} strokeWidth="1.7"><ellipse cx={cx} cy={cy-6} rx="9" ry="3.5"/><path d={`M${cx-9} ${cy-6}v12c0 2 4 4 9 4s9-2 9-4V${cy-6}M${cx-9} ${cy}c0 2 4 4 9 4s9-2 9-4`} /></g>}
    {icon === "cloud" && <path d={`M${cx-9} ${cy+5}h17a5 5 0 0 0 0-10 7 7 0 0 0-13-2 5 5 0 0 0-4 12`} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />}
    <Label x={x + 51} y={y + 31} anchor="start" size={13} weight={750}>{title}</Label>
    {detail && <Label x={x + 51} y={y + 51} anchor="start" size={10.5} color="#65736B" weight={500}>{detail}</Label>}
  </g>;
}

function Arrow({ x1, y1, x2, y2, color = "#829088", dashed = false }: { x1: number; y1: number; x2: number; y2: number; color?: string; dashed?: boolean }) {
  return <g stroke={color} strokeWidth="2" fill="none" strokeDasharray={dashed ? "5 5" : undefined} strokeLinecap="round" strokeLinejoin="round">
    <path d={`M${x1} ${y1} L${x2} ${y2}`} />
    <path d={`M${x2-6} ${y2-4} L${x2} ${y2} L${x2-6} ${y2+4}`} />
  </g>;
}

function Frame({ title, description, children, className = "" }: { title: string; description: string; children: ReactNode; className?: string }) {
  return <figure className={`group overflow-hidden rounded-[1.6rem] border border-[#203524]/12 bg-white shadow-[0_10px_30px_rgba(32,53,36,.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(32,53,36,.12)] ${className}`}>
    <figcaption className="border-b border-[#203524]/8 px-5 py-4">
      <p className="text-[.65rem] font-bold uppercase tracking-[.18em] text-[#5D7261]">AWS workload diagram</p>
      <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#17251A]">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-[#536158]">{description}</p>
    </figcaption>
    <div className="overflow-x-auto p-4 sm:p-5"><div className="min-w-[520px]">{children}</div></div>
  </figure>;
}

function Svg({ title, children, viewBox = "0 0 700 210" }: { title: string; children: React.ReactNode; viewBox?: string }) {
  return <svg viewBox={viewBox} role="img" aria-label={title} className="h-auto w-full" fontFamily="Inter, Aptos, 'Segoe UI', sans-serif">
    <title>{title}</title>
    <rect x="1" y="1" width="698" height="208" rx="20" fill="#F7F9F5" stroke="#E3E9E2" />
    {children}
  </svg>;
}

export function WorkloadLayerDiagrams() {
  return <div className="space-y-6">
    <section className="rounded-[2rem] border border-[#203524]/10 bg-[#203524] p-5 text-[#F5F5F2] md:p-7" aria-labelledby="layers-overview-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-[.68rem] font-bold uppercase tracking-[.2em] text-[#C4F36B]">One contact center · five workload layers</p><h2 id="layers-overview-title" className="mt-2 text-2xl font-semibold tracking-tight">A map of responsibility</h2></div>
        <p className="max-w-xl text-sm leading-relaxed text-white/70">Select a layer to jump to its diagram. Together, the layers help teams locate ownership, dependencies, and operational handoffs.</p>
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["01", "Telephony", "Voice path", "#C4F36B", "telephony"],
          ["02", "Interface / API", "Access + integrations", "#61D4E2", "interface"],
          ["03", "Flows / IVR", "Contact orchestration", "#E9B45D", "flows"],
          ["04", "Agent workstation", "Endpoint + network", "#AA91F6", "workstation"],
          ["05", "Metrics + reporting", "Measure + respond", "#72B99A", "metrics"],
        ].map(([n, label, detail, color, id]) => <a key={id} href={`#${id}`} className="rounded-2xl border border-white/12 bg-white/[.045] p-4 transition hover:border-white/40 hover:bg-white/[.09] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C4F36B]">
          <span className="text-[.65rem] font-bold tracking-[.16em]" style={{ color }}>{n}</span><span className="mt-2 block text-sm font-bold text-white">{label}</span><span className="mt-1 block text-xs text-white/60">{detail}</span>
        </a>)}
      </div>
    </section>

    <section id="telephony" className="scroll-mt-28">
      <div className="mb-3 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#C4F36B]/20 text-[#355B3A]"><Phone size={18}/></span><div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#5D7261]">Layer 01</p><h2 className="text-2xl font-semibold tracking-tight text-[#17251A]">Telephony</h2></div></div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Frame title="The voice path" description="The telephony layer controls the endpoint reached through the carrier and PSTN into the Amazon Connect instance.">
          <Svg title="Voice path from caller through carrier and public telephone network to Amazon Connect">
            <Node x={24} y={66} title="Caller" detail="places a voice call" icon="phone" />
            <Arrow x1={176} y1={104} x2={214} y2={104} />
            <Node x={216} y={66} title="Carrier + PSTN" detail="routes the audio path" color={cyan} icon="network" />
            <Arrow x1={368} y1={104} x2={407} y2={104} />
            <Node x={409} y={66} w={265} title="Amazon Connect" detail="claimed number · contact instance" color={lime} icon="cloud" />
            <Label x={350} y={177} size={11} color="#5D7261">Number assignment and flow association are configured in the Connect interface</Label>
          </Svg>
        </Frame>
        <Frame title="Resilient managed telephony" description="AWS describes redundant network paths and load-balanced media servers across multiple Availability Zones.">
          <Svg title="Redundant carriers and paths feed load-balanced media servers across Availability Zones">
            <Node x={20} y={69} w={145} title="Carrier A" detail="dedicated path" color={cyan} icon="network" />
            <Node x={20} y={145} w={145} title="Carrier B" detail="redundant path" color={violet} icon="network" />
            <Arrow x1={165} y1={105} x2={210} y2={105} color={cyan} />
            <Arrow x1={165} y1={178} x2={210} y2={125} color={violet} />
            <Node x={212} y={75} w={146} title="Load balancer" detail="media server fleet" color={lime} icon="server" />
            <Arrow x1={358} y1={104} x2={400} y2={104} />
            <rect x="402" y="36" width="270" height="150" rx="18" fill="#EDF3EA" stroke="#9CAD9A" strokeDasharray="5 5"/>
            <Label x={537} y={58} size={10} color="#607060" weight={700}>AMAZON CONNECT · MULTI-AZ</Label>
            <Node x={418} y={69} w={112} h={48} title="AZ · 1" color={lime} icon="server" />
            <Node x={544} y={69} w={112} h={48} title="AZ · 2" color={cyan} icon="server" />
            <Node x={418} y={128} w={112} h={48} title="AZ · 3+" color={violet} icon="server" />
            <Label x={600} y={197} size={10} color="#5D7261">Faulted endpoints can be removed from rotation</Label>
          </Svg>
        </Frame>
      </div>
    </section>

    <section id="interface" className="scroll-mt-28">
      <div className="mb-3 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#61D4E2]/20 text-[#28636B]"><Laptop size={18}/></span><div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#5D7261]">Layer 02</p><h2 className="text-2xl font-semibold tracking-tight text-[#17251A]">Connect Customer interface / API</h2></div></div>
      <Frame title="People and systems access Connect through interfaces and APIs" description="This layer includes browser-based tools, agent and supervisor access, custom applications, and APIs used by customer-facing chat.">
        <Svg title="Agent, supervisor, administrator and customer interfaces connect through browser and API paths">
          <Node x={18} y={26} w={160} title="Agent + supervisor" detail="CCP · metrics · recordings" color={violet} icon="agent"/>
          <Node x={18} y={124} w={160} title="Contact / customer" detail="web chat interface" color={amber} icon="phone"/>
          <Arrow x1={178} y1={64} x2={233} y2={84}/>
          <Arrow x1={178} y1={162} x2={233} y2={127}/>
          <rect x="235" y="37" width="235" height="132" rx="20" fill="#EAF6F5" stroke="#61D4E2" strokeWidth="1.5"/>
          <Label x={352} y={62} size={10} color="#28636B" weight={750}>CONNECT CUSTOMER INTERFACE/API</Label>
          <Node x={254} y={76} w={196} h={72} title="Browser + CCP" detail="Streams · Chat API · Gateway" color={cyan} icon="agent"/>
          <Arrow x1={470} y1={103} x2={514} y2={103}/>
          <Node x={516} y={65} w={166} title="Connect services" detail="auth · config · contact tools" color={lime} icon="cloud"/>
          <Label x={350} y={195} size={10} color="#5D7261">Custom desktop / CRM paths can use Streams or a configured integration</Label>
        </Svg>
      </Frame>
    </section>

    <section id="flows" className="scroll-mt-28">
      <div className="mb-3 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#E9B45D]/22 text-[#805B1B]"><Route size={18}/></span><div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#5D7261]">Layer 03</p><h2 className="text-2xl font-semibold tracking-tight text-[#17251A]">Flows / IVR</h2></div></div>
      <Frame title="A flow coordinates the customer interaction" description="Flows can collect input, set contact attributes, call integrations, and route contacts to the right queue or agent.">
        <Svg title="Customer enters a contact flow which can invoke Lex, Lambda and data resources before routing to an agent">
          <Node x={18} y={69} w={132} title="Customer" detail="voice or chat" color={amber} icon="phone"/>
          <Arrow x1={150} y1={107} x2={190} y2={107}/>
          <rect x="192" y="33" width="210" height="150" rx="20" fill="#FFF7E8" stroke="#E9B45D" strokeWidth="1.5"/>
          <Label x={297} y={58} size={10} color="#805B1B" weight={750}>CONTACT FLOW / IVR</Label>
          <Node x={208} y={76} w={178} h={82} title="Prompt · collect · decide" detail="attributes · branches · queues" color={amber} icon="server"/>
          <Arrow x1={402} y1={107} x2={443} y2={107}/>
          <Node x={445} y={69} w={136} title="Queue" detail="routing profile" color={lime} icon="network"/>
          <Arrow x1={581} y1={107} x2={588} y2={107}/>
          <Node x={588} y={69} w={96} title="Agent" detail="handles" color={violet} icon="agent"/>
          <path d="M297 183 V198 H510 V179" fill="none" stroke="#A2B09F" strokeDasharray="4 4"/>
          <Label x={400} y={204} size={9.5} color="#5D7261">Optional integrations: Lambda · Lex · Kinesis · VPC · databases</Label>
        </Svg>
      </Frame>
    </section>

    <section id="workstation" className="scroll-mt-28">
      <div className="mb-3 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#AA91F6]/20 text-[#59439C]"><Headphones size={18}/></span><div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#5D7261]">Layer 04</p><h2 className="text-2xl font-semibold tracking-tight text-[#17251A]">Agent workstation</h2></div></div>
      <Frame title="The endpoint around the agent experience" description="AWS identifies this as customer-managed: device, browser, network, headset, security controls, and the surrounding work environment.">
        <Svg title="Agent endpoint components outside the AWS-managed Connect service boundary">
          <rect x="22" y="28" width="350" height="155" rx="20" fill="#F3F0FB" stroke="#AA91F6" strokeDasharray="6 5"/>
          <Label x={197} y={50} size={10} color="#59439C" weight={750}>CUSTOMER-MANAGED WORKSTATION</Label>
          <Node x={42} y={70} w={150} title="Browser / VDI" detail="OS · endpoint security" color={violet} icon="agent"/>
          <Node x={208} y={70} w={145} title="Headset" detail="audio device" color={violet} icon="phone"/>
          <Node x={42} y={128} w={150} h={45} title="Local network" color={cyan} icon="network"/>
          <Label x={275} y={151} size={10} color="#59439C">ISP · VPN · power · facility</Label>
          <Arrow x1={372} y1={106} x2={429} y2={106} color={violet}/>
          <rect x="431" y="48" width="242" height="116" rx="20" fill="#EDF3EA" stroke="#92AA8E"/>
          <Label x={552} y={72} size={10} color="#536C52" weight={750}>AMAZON CONNECT INTERFACE</Label>
          <Node x={455} y={84} w={195} h={63} title="Contact Control Panel" detail="agent voice + contact controls" color={lime} icon="cloud"/>
        </Svg>
      </Frame>
    </section>

    <section id="metrics" className="scroll-mt-28">
      <div className="mb-3 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#72B99A]/20 text-[#2F6D53]"><BarChart3 size={18}/></span><div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#5D7261]">Layer 05</p><h2 className="text-2xl font-semibold tracking-tight text-[#17251A]">Metrics and reporting</h2></div></div>
      <Frame title="Metrics move through storage, processing, alerting, and dashboards" description="The layer includes native and third-party services that deliver, store, process, monitor, and visualize operational data.">
        <Svg title="Contact center metrics and records flow to storage, data warehouse, monitoring and reporting services">
          <Node x={16} y={72} w={154} title="Connect metrics" detail="real-time + historical" color={lime} icon="cloud"/>
          <Arrow x1={170} y1={108} x2={212} y2={108}/>
          <rect x="214" y="28" width="250" height="155" rx="20" fill="#EAF6F0" stroke="#72B99A"/>
          <Label x={339} y={52} size={10} color="#2F6D53" weight={750}>DATA + EVENT PIPELINES</Label>
          <Node x={229} y={66} w={104} h={60} title="Amazon S3" detail="recordings · reports" color={amber} icon="data"/>
          <Node x={345} y={66} w={104} h={60} title="Kinesis" detail="contact records" color={cyan} icon="network"/>
          <Node x={229} y={133} w={220} h={38} title="Redshift / data warehouse" color={violet} icon="data"/>
          <Arrow x1={464} y1={108} x2={507} y2={108}/>
          <Node x={509} y={38} w={172} title="CloudWatch" detail="metrics + alarms" color={cyan} icon="server"/>
          <Node x={509} y={124} w={172} title="Dashboards" detail="OpenSearch · Kibana" color={lime} icon="data"/>
          <Label x={600} y={204} size={10} color="#5D7261">SNS / Lambda can react to configured alarms</Label>
        </Svg>
      </Frame>
    </section>
  </div>;
}
