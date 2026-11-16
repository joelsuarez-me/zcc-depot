import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, BadgeCheck, Phone, ShieldCheck, Signal } from "lucide-react";
import { Ext, Note, PageHero, Section, SectionHead } from "@/components/kit";

type Level = "A" | "B" | "C";
const LEVELS: { id: Level; name: string; short: string; detail: string; color: string }[] = [
  { id: "A", name: "Full attestation", short: "Identity + number authorization verified", detail: "The originating provider authenticated the caller and confirmed authorization to use the calling number. AWS says A-level requires the applicable AWS service terms or an authorized solution provider/distribution seller, plus a number claimed or ported into Connect Customer.", color: "#C4F36B" },
  { id: "B", name: "Partial attestation", short: "Caller authenticated; number authorization not verified", detail: "The originating provider authenticated the caller but cannot verify authorization to use that number. AWS also describes B-level in cases where it has requested information and has not yet confirmed validation.", color: "#F4B942" },
  { id: "C", name: "Gateway attestation", short: "Origin known only as the call entry point", detail: "The provider originated the call but cannot verify the caller’s identity or legitimate use of the number. AWS says calls that do not qualify for A or B receive C-level.", color: "#F38B77" },
];

function CallPath({ level, setLevel }: { level: Level; setLevel: (level: Level) => void }) {
  const selected = LEVELS.find(x => x.id === level)!;
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111A23] p-5 text-[#F5F5F2] shadow-[0_24px_70px_rgba(17,26,35,.3)] md:p-8" style={{ background: "radial-gradient(ellipse at top left, rgba(63,90,99,.34), transparent 42%), linear-gradient(145deg, #101820, #111A23 52%, #161827)" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="eyebrow text-[#D1F470]">Interactive call path</p><p className="mt-1 text-sm text-white/65">Select a level to see the trust statement carried with an eligible call.</p></div>
        <div className="inline-flex rounded-full border border-white/15 bg-white/5 p-1" role="group" aria-label="Choose an attestation level">
          {LEVELS.map(x => <button key={x.id} type="button" onClick={() => setLevel(x.id)} aria-pressed={level === x.id} className={"rounded-full px-4 py-2 text-sm font-semibold transition " + (level === x.id ? "bg-[#D1F470] text-[#11110D]" : "text-white/70 hover:text-white")}>Level {x.id}</button>)}
        </div>
      </div>
      <div className="mt-6 rounded-3xl border border-white/10 bg-[#18242D] p-4 md:p-6">
        <svg viewBox="0 0 1000 250" role="img" aria-labelledby="stir-path-title stir-path-desc" className="h-auto w-full" fontFamily="Inter, Aptos, 'Segoe UI', sans-serif">
          <title id="stir-path-title">STIR/SHAKEN outbound call authentication path</title>
          <desc id="stir-path-desc">An outbound call from an Amazon Connect number carries an attestation header through carrier networks to the recipient. Header preservation depends on each network along the route.</desc>
          <defs>
            <linearGradient id="stir-trail" x1="0" x2="1"><stop offset="0%" stopColor="#C4F36B" /><stop offset="52%" stopColor="#67D5E4" /><stop offset="100%" stopColor="#A78BFA" /></linearGradient>
            <linearGradient id="stir-card" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#24333C" /><stop offset="100%" stopColor="#17232C" /></linearGradient>
            <filter id="stir-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          <path d="M130 112 H870" stroke="#43515B" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M130 112 H870" stroke="url(#stir-trail)" strokeWidth="3" strokeDasharray="9 13" strokeLinecap="round" fill="none" opacity=".9" />
          <circle r="8" cy="112" fill="#D1F470" filter="url(#stir-glow)"><animateMotion className="stir-packet-motion" dur="4.8s" repeatCount="indefinite" path="M130 112 H870" /></circle>
          <circle r="3.5" cy="112" fill="#fff"><animateMotion className="stir-packet-motion" dur="4.8s" begin="1.6s" repeatCount="indefinite" path="M130 112 H870" /></circle>
          <g transform="translate(34 58)">
            <rect x="-4" y="-4" width="200" height="104" rx="25" fill="#C4F36B" opacity=".08" /><rect width="192" height="96" rx="22" fill="url(#stir-card)" stroke="#C4F36B" strokeWidth="1.6" />
            <rect x="14" y="13" width="164" height="20" rx="10" fill="#C4F36B" opacity=".15" /><text x="96" y="27" textAnchor="middle" fill="#D1F470" fontSize="9.5" fontWeight="750" letterSpacing="1.5">ORIGINATING PROVIDER</text>
            <circle cx="38" cy="61" r="18" fill="#C4F36B" opacity=".17" /><path d="M29 61l7 7 13-15" stroke="#C4F36B" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x="67" y="58" fill="#F5F5F2" fontSize="15" fontWeight="750">Amazon Connect</text><text x="67" y="77" fill="#BCC8C1" fontSize="12" fontWeight="500">signs eligible call</text>
          </g>
          <g transform="translate(404 58)">
            <rect x="-4" y="-4" width="200" height="104" rx="25" fill="#67D5E4" opacity=".08" /><rect width="192" height="96" rx="22" fill="url(#stir-card)" stroke="#67D5E4" strokeWidth="1.6" />
            <rect x="14" y="13" width="164" height="20" rx="10" fill="#67D5E4" opacity=".14" /><text x="96" y="27" textAnchor="middle" fill="#8CE6EF" fontSize="9.5" fontWeight="750" letterSpacing="1.5">TRANSIT NETWORKS</text>
            <circle cx="38" cy="61" r="18" fill="#67D5E4" opacity=".16" /><path d="M27 62h22M31 54v16M38 51v22M45 57v10" stroke="#67D5E4" strokeWidth="2.5" strokeLinecap="round" />
            <text x="67" y="58" fill="#F5F5F2" fontSize="15" fontWeight="750">Carrier network</text><text x="67" y="77" fill="#BCC8C1" fontSize="12" fontWeight="500">may use the signal</text>
          </g>
          <g transform="translate(774 58)">
            <rect x="-4" y="-4" width="200" height="104" rx="25" fill="#A78BFA" opacity=".08" /><rect width="192" height="96" rx="22" fill="url(#stir-card)" stroke="#A78BFA" strokeWidth="1.6" />
            <rect x="14" y="13" width="164" height="20" rx="10" fill="#A78BFA" opacity=".15" /><text x="96" y="27" textAnchor="middle" fill="#C4B5FD" fontSize="9.5" fontWeight="750" letterSpacing="1.5">RECEIVING PARTY</text>
            <circle cx="38" cy="56" r="8" fill="none" stroke="#C4B5FD" strokeWidth="2.5" /><path d="M23 79c2-14 28-14 30 0" fill="none" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" />
            <text x="67" y="58" fill="#F5F5F2" fontSize="15" fontWeight="750">Recipient</text><text x="67" y="77" fill="#BCC8C1" fontSize="12" fontWeight="500">carrier decides treatment</text>
          </g>
          <rect x="362" y="183" width="276" height="38" rx="19" fill="#202E37" stroke="#65766D" strokeWidth="1.2" /><circle cx="384" cy="202" r="5" fill="#C4F36B" />
          <text x="500" y="207" textAnchor="middle" fill="#E2E9E3" fontSize="13" fontWeight="600">Identity header · Attestation {level}</text>
          <text x="500" y="241" textAnchor="middle" fill="#8D9A93" fontSize="10.5" fontWeight="500" letterSpacing=".4">SIGNATURE TRAVELS WITH THE CALL · CARRIERS CONTROL HOW THEY USE IT</text>
        </svg>
        <style>{`@media (prefers-reduced-motion: reduce) { .stir-packet-motion { display: none; } }`}</style>
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 p-4" aria-live="polite">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black text-[#11110D]" style={{ backgroundColor: selected.color }}>{level}</span>
          <div><p className="font-semibold text-white">{selected.name}</p><p className="mt-1 text-sm leading-relaxed text-white/70">{selected.detail}</p></div>
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-white/50">Illustration: the call travels through multiple networks; STIR/SHAKEN is a signal about caller identity and number authorization, not a guarantee that a call will connect or avoid spam labels. <Ext href="https://docs.aws.amazon.com/connect/latest/adminguide/stirshaken.html" className="text-[#D1F470] underline">AWS attestation guide</Ext> · <Ext href="https://docs.fcc.gov/public/attachments/FCC-24-120A1.pdf" className="text-[#D1F470] underline">FCC explanation of the framework</Ext></p>
    </div>
  );
}

export default function ResourceStirShaken() {
  const [level, setLevel] = useState<Level>("A");
  useEffect(() => {
    const priorTitle = document.title;
    document.title = "STIR/SHAKEN | ZCC Depot";
    return () => { document.title = priorTitle; };
  }, []);
  return (
    <>
      <PageHero eyebrow="Resources · Outbound voice" title={<>Caller identity, <span className="serif italic text-[#D1F470]">carried with the call.</span></>} lede="A practical guide to STIR/SHAKEN in Zendesk Contact Center: what Amazon Connect authenticates, what A/B/C attestation means, and how to request Attestation A for your numbers.">
        <a href="#attestation" className="rounded-full bg-[#D1F470] px-5 py-3 text-sm font-semibold text-[#11110D]">Explore the call path<ArrowDown className="ml-2 inline h-4 w-4" aria-hidden /></a>
        <Ext href="https://support.zendesk.com/hc/en-us/articles/4410699438746-How-do-I-prevent-calls-to-my-end-users-from-displaying-as-spam" className="rounded-full border border-[#F5F5F2]/25 px-5 py-3 text-sm font-semibold hover:border-[#D1F470] hover:text-[#D1F470]">Zendesk registration guidance<ArrowUpRight className="ml-2 inline h-4 w-4" aria-hidden /></Ext>
      </PageHero>

      <Section id="overview">
        <SectionHead permalinkId="overview" num="01" eyebrow="Built into the voice path" title="A signed call gives carriers a stronger signal" lede="STIR/SHAKEN adds authentication information to eligible outbound calls. Explore the signing path, the attestation levels, and the registration steps." />
        <p className="mb-5 max-w-4xl text-sm leading-relaxed text-[#11110D]/70">Zendesk describes Contact Center as powered by Amazon Connect, and AWS documents STIR/SHAKEN signing for outbound calls from US DIDs and toll-free numbers to NANP destinations (+1). <Ext href="https://support.zendesk.com/hc/en-us/articles/10342463822746-About-AWS-services-in-Contact-Center" className="font-semibold text-[#203524] underline">Zendesk service overview</Ext> · <Ext href="https://docs.aws.amazon.com/connect/latest/adminguide/stirshaken.html" className="font-semibold text-[#203524] underline">AWS STIR/SHAKEN guide</Ext>.</p>
        <CallPath level={level} setLevel={setLevel} />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-[#203524]/15 bg-[#FBFBF8] p-5"><ShieldCheck className="h-6 w-6 text-[#355B3A]" /><h3 className="mt-3 font-semibold">Caller ID authentication</h3><p className="mt-2 text-sm leading-relaxed text-[#11110D]/70">The framework helps verify the caller’s relationship to the number shown, making spoofed caller ID harder to pass off as authentic. <Ext href="https://docs.fcc.gov/public/attachments/FCC-24-120A1.pdf" className="font-semibold text-[#203524] underline">FCC framework overview</Ext></p></article>
          <article className="rounded-3xl border border-[#203524]/15 bg-[#FBFBF8] p-5"><Signal className="h-6 w-6 text-[#355B3A]" /><h3 className="mt-3 font-semibold">Carrier signal</h3><p className="mt-2 text-sm leading-relaxed text-[#11110D]/70">Receiving carriers may use the attestation level when deciding how to handle a call. They control their own call treatment and filtering. <Ext href="https://docs.aws.amazon.com/connect/latest/adminguide/stirshaken.html" className="font-semibold text-[#203524] underline">AWS carrier notes</Ext></p></article>
          <article className="rounded-3xl border border-[#203524]/15 bg-[#FBFBF8] p-5"><Phone className="h-6 w-6 text-[#355B3A]" /><h3 className="mt-3 font-semibold">North American scope</h3><p className="mt-2 text-sm leading-relaxed text-[#11110D]/70">AWS documents signing for calls from US DIDs and toll-free numbers to NANP destinations. This guide describes that scope; it does not imply identical behavior for every country or route. <Ext href="https://docs.aws.amazon.com/connect/latest/adminguide/stirshaken.html" className="font-semibold text-[#203524] underline">AWS coverage statement</Ext></p></article>
        </div>
      </Section>

      <Section tone="white" id="attestation">
        <SectionHead permalinkId="attestation" num="02" eyebrow="Three levels of trust" title="What the A, B, and C mean" lede="The attestation level describes what the originating provider could verify about the caller and the caller’s right to use the number. Select a level in the call-path illustration above to inspect AWS’s descriptions." />
        <div className="grid gap-4 md:grid-cols-3">
          {LEVELS.map((item) => <button key={item.id} type="button" onClick={() => setLevel(item.id)} aria-pressed={level === item.id} className={"rounded-3xl border p-6 text-left transition " + (level === item.id ? "border-[#203524] bg-[#EAF2DB] shadow-lg" : "border-[#203524]/15 bg-[#FBFBF8] hover:border-[#203524]/50")}>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black text-[#11110D]" style={{ backgroundColor: item.color }}>{item.id}</span><span className="mt-4 block text-lg font-semibold">{item.name}</span><span className="mt-1 block text-sm text-[#203524]/70">{item.short}</span>
          </button>)}
        </div>
        <p className="mt-5 text-sm leading-relaxed text-[#11110D]/70">For A-level, AWS requires the customer to be subject to AWS Service Terms or use an authorized AWS Solution Provider/Distribution Seller, and the number must be claimed or ported into Connect Customer. B-level may apply when AWS needs more information and has not confirmed validation. Calls that qualify for neither A nor B receive C. <Ext href="https://docs.aws.amazon.com/connect/latest/adminguide/stirshaken.html" className="font-semibold text-[#203524] underline">See AWS’s current level requirements</Ext>.</p>
      </Section>

      <Section id="registration">
        <SectionHead permalinkId="registration" num="03" eyebrow="Request Attestation A" title="Start with Zendesk Support" lede="Zendesk’s published registration path is a Support request with business and number details. Zendesk and AWS validate the information before deciding what attestation can be applied." />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-[2rem] bg-[#111A23] p-7 text-white lg:col-span-7">
            <p className="eyebrow text-[#D1F470]">Registration checklist</p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">Prepare the information Zendesk asks for when requesting Attestation A registration:</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {["Phone numbers to register", "Legal business name and EIN", "CNAM caller name", "Physical address associated with EIN", "Business type and industry", "Operating regions and website", "Two authorized business representatives", "Each representative’s name, email, phone, title, and position"].map(item => <li key={item} className="flex gap-2 text-sm leading-relaxed text-white/85"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#D1F470]" />{item}</li>)}
            </ul>
            <Ext href="https://support.zendesk.com/hc/en-us/articles/4410699438746-How-do-I-prevent-calls-to-my-end-users-from-displaying-as-spam" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D1F470] px-4 py-2.5 text-sm font-semibold text-[#11110D]">Open Zendesk’s current instructions<ArrowUpRight className="h-4 w-4" aria-hidden /></Ext>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-[2rem] border border-[#203524]/15 bg-[#F7F0E5] p-6">
              <p className="eyebrow text-[#203524]/65">Keep the trust signal useful</p>
              <h3 className="mt-2 text-xl font-semibold">Respond to follow-up requests</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#11110D]/70">AWS may ask for additional information to maintain higher attestation. Delayed or missing responses can lower the attestation level and affect call delivery. <Ext href="https://docs.aws.amazon.com/connect/latest/adminguide/stirshaken.html" className="font-semibold text-[#203524] underline">AWS explains follow-up requirements</Ext>.</p>
            </div>
            <div className="mt-4"><Note>Attestation is not a promise that every carrier will deliver a call, show the expected caller name, or avoid spam labeling. AWS says intermediate legacy networks may not preserve the authentication header end to end, and carriers decide how to use the signal. <Ext href="https://docs.aws.amazon.com/connect/latest/adminguide/stirshaken.html" className="font-semibold underline">AWS limitations</Ext>.</Note></div>
          </div>
        </div>
      </Section>

      <Section tone="white" id="limits">
        <SectionHead permalinkId="limits" num="04" eyebrow="Expectation setting" title="Authentication helps. It does not guarantee reputation." lede="STIR/SHAKEN authenticates information about a call; carrier screening, caller-name display, number reputation, and call completion involve other systems and decisions." />
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-[#203524]/15 bg-[#FBFBF8] p-6"><p className="eyebrow text-[#203524]/60">Carrier decisions</p><h3 className="mt-2 text-lg font-semibold">An attestation level is one input</h3><p className="mt-2 text-sm leading-relaxed text-[#11110D]/70">AWS says carriers might use attestation when determining call delivery. An A-level does not guarantee that a call will avoid spam labels or reach the recipient. <Ext href="https://docs.aws.amazon.com/connect/latest/adminguide/stirshaken.html" className="font-semibold text-[#203524] underline">AWS guidance</Ext></p></article>
          <article className="rounded-3xl border border-[#203524]/15 bg-[#FBFBF8] p-6"><p className="eyebrow text-[#203524]/60">Caller name + reputation</p><h3 className="mt-2 text-lg font-semibold">Keep these registrations distinct</h3><p className="mt-2 text-sm leading-relaxed text-[#11110D]/70">Zendesk describes CNAM as optional and separately suggests registering with Call Transparency and TNS Call Guardian for additional number-reputation protection. These services are not the STIR/SHAKEN attestation itself. <Ext href="https://support.zendesk.com/hc/en-us/articles/4410699438746-How-do-I-prevent-calls-to-my-end-users-from-displaying-as-spam" className="font-semibold text-[#203524] underline">Zendesk guidance</Ext></p></article>
        </div>
      </Section>

      <Section id="sources">
        <SectionHead permalinkId="sources" num="05" eyebrow="Primary sources" title="Source links" lede="These primary sources support the technical scope, attestation definitions, registration information, and limitations described above." />
        <div className="grid gap-3 md:grid-cols-3">
          <Ext href="https://docs.aws.amazon.com/connect/latest/adminguide/stirshaken.html" className="rounded-2xl border border-[#203524]/15 bg-[#FBFBF8] p-5 font-semibold text-[#203524] hover:border-[#203524]">Amazon Connect: STIR/SHAKEN attestation<ArrowUpRight className="ml-2 inline h-4 w-4" aria-hidden /></Ext>
          <Ext href="https://support.zendesk.com/hc/en-us/articles/4410699438746-How-do-I-prevent-calls-to-my-end-users-from-displaying-as-spam" className="rounded-2xl border border-[#203524]/15 bg-[#FBFBF8] p-5 font-semibold text-[#203524] hover:border-[#203524]">Zendesk: Registering numbers for Attestation A<ArrowUpRight className="ml-2 inline h-4 w-4" aria-hidden /></Ext>
          <Ext href="https://docs.fcc.gov/public/attachments/FCC-24-120A1.pdf" className="rounded-2xl border border-[#203524]/15 bg-[#FBFBF8] p-5 font-semibold text-[#203524] hover:border-[#203524]">FCC: Caller ID authentication framework<ArrowUpRight className="ml-2 inline h-4 w-4" aria-hidden /></Ext>
        </div>
      </Section>
    </>
  );
}
