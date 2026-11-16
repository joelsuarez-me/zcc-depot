import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, Download, FileText, Printer } from "lucide-react";
import { Ext, Note, PageHero, Section, SectionHead } from "@/components/kit";

const PORTING_STEPS = [
  { title: "Check eligibility and plan", copy: "Portability depends on the country, number type, carrier agreements, and your service terms. Check AWS regional requirements and open a separate support request for each carrier and country combination." },
  { title: "Open an AWS Support case", copy: "Choose Connect (Number Management) and the applicable Number Porting category. Include the target instance ARN, an E.164 number, the destination flow name, requested date and time, current carrier, and an authorized contact. Do not attach documents containing personal information to the initial case." },
  { title: "Complete the AWS LOA", copy: "If AWS confirms the numbers are eligible, complete the LOA AWS provides. Match the current carrier's Customer Service Record (CSR) exactly. Each losing carrier needs a separate LOA; country-specific forms and supporting documents may apply." },
  { title: "Upload documents securely", copy: "Wait for the AWS team to send an account-specific secure S3 upload link. The link expires after 10 days and must be used by an authorized user on the account." },
  { title: "Carrier validation and agreed date", copy: "AWS coordinates with the Connect Customer carrier and your current carrier. After validation, the carriers confirm a mutually agreed date and time. A mismatch can lead to rejection and a new submission." },
  { title: "Prepare and verify the cutover", copy: "Confirm the numbers appear in the Connect instance, map each to the correct flow, and request required quota changes in advance. On the agreed date, keep agents ready, test inbound calls, and monitor routing before closing the old service." },
];

const FLOW_NODES = [
  { x: 45, title: "Current provider", sub: "Losing carrier" },
  { x: 285, title: "AWS porting team", sub: "Eligibility + LOA" },
  { x: 525, title: "Connect carrier", sub: "Carrier coordination" },
  { x: 765, title: "Amazon Connect", sub: "Flow + test calls" },
];

function PortingFlow() {
  const [active, setActive] = useState(0);
  const selectedNode = active < 2 ? 0 : active < 4 ? 1 : active === 4 ? 2 : 3;
  return (
    <div className="overflow-hidden rounded-[2rem] border border-[#203524]/15 bg-[#111A23] p-4 text-[#F5F5F2] md:p-7">
      <svg viewBox="0 0 1000 330" role="img" aria-labelledby="porting-flow-title porting-flow-desc" className="h-auto w-full">
        <title id="porting-flow-title">Interactive phone number porting flow</title>
        <desc id="porting-flow-desc">A phone number moves from the current provider through AWS porting coordination and the Connect carrier to Amazon Connect. A separate dashed lane shows toll-free RespOrg record coordination.</desc>
        <defs>
          <linearGradient id="porting-line" x1="0" x2="1"><stop offset="0" stopColor="#D1F470" /><stop offset="1" stopColor="#FF9B34" /></linearGradient>
          <filter id="porting-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <path d="M145 105 H855" fill="none" stroke="#53635A" strokeWidth="4" strokeLinecap="round" />
        <path d="M145 105 H855" fill="none" stroke="url(#porting-line)" strokeWidth="2" strokeDasharray="7 13" strokeLinecap="round" opacity=".8" />
        <circle r="8" fill="#D1F470" filter="url(#porting-glow)">
          <animateMotion className="porting-packet-motion" dur="5.5s" repeatCount="indefinite" path="M145 105 H855" />
        </circle>
        <circle r="5" fill="#FF9B34" filter="url(#porting-glow)">
          <animateMotion className="porting-packet-motion" dur="5.5s" begin="-2.75s" repeatCount="indefinite" path="M145 105 H855" />
        </circle>
        {FLOW_NODES.map((node, i) => (
          <g key={node.title}>
            <rect x={node.x} y="50" width="190" height="112" rx="18" fill={selectedNode === i ? "#203524" : "#18242D"} stroke={selectedNode === i ? "#D1F470" : "#52615B"} strokeWidth={selectedNode === i ? "3" : "1.5"} />
            <circle cx={node.x + 24} cy="78" r="8" fill={selectedNode === i ? "#D1F470" : "#809087"} />
            <text x={node.x + 20} y="112" fill="#F5F5F2" fontSize="16" fontWeight="700">{node.title}</text>
            <text x={node.x + 20} y="137" fill="#B7C2B9" fontSize="13">{node.sub}</text>
          </g>
        ))}
        <path d="M150 248 H555" fill="none" stroke="#A78BFA" strokeWidth="3" strokeDasharray="6 8" />
        <circle r="6" fill="#C4B5FD"><animateMotion dur="4.5s" repeatCount="indefinite" path="M150 248 H555" /></circle>
        <text x="45" y="222" fill="#D1F470" fontSize="13" fontWeight="700">US TOLL-FREE REGISTRY LANE</text>
        <rect x="45" y="265" width="260" height="45" rx="12" fill="#242237" stroke="#A78BFA" />
        <text x="64" y="293" fill="#F5F5F2" fontSize="14">Current RespOrg record</text>
        <rect x="555" y="265" width="350" height="45" rx="12" fill="#242237" stroke="#A78BFA" />
        <text x="575" y="293" fill="#F5F5F2" fontSize="14">Amazon RespOrg when available · SOMOS</text>
      </svg>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .porting-packet-motion { display: none; }
        }
      `}</style>
      <div className="porting-step-controls mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {PORTING_STEPS.map((step, i) => (
          <button key={step.title} type="button" onClick={() => setActive(i)} aria-pressed={active === i}
            className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${active === i ? "border-[#D1F470] bg-[#203524] text-[#D1F470]" : "border-white/15 bg-white/5 text-white/75 hover:border-white/40"}`}>
            <span className="mono mr-2 text-xs opacity-60">0{i + 1}</span>{step.title}
          </button>
        ))}
      </div>
      <div className="porting-active-step mt-3 flex items-start gap-3 rounded-2xl bg-white/5 p-4" aria-live="polite">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#D1F470] text-sm font-bold text-[#11110D]">{active + 1}</span>
        <div><p className="font-semibold">{PORTING_STEPS[active].title}</p><p className="mt-1 text-sm leading-relaxed text-white/70">{PORTING_STEPS[active].copy}</p></div>
      </div>
      <ol className="porting-step-print-only">
        {PORTING_STEPS.map((step, i) => <li key={step.title}><strong>{String(i + 1).padStart(2, "0")} · {step.title}</strong><p>{step.copy}</p></li>)}
      </ol>
    </div>
  );
}

function DownloadCard({ href, filename, title, description, testId }: { href: string; filename: string; title: string; description: string; testId: string }) {
  return (
    <a href={href} download={filename} data-testid={testId} className="group flex h-full items-start gap-4 rounded-2xl border border-[#203524]/15 bg-[#FBFBF8] p-5 transition hover:-translate-y-0.5 hover:border-[#203524]/50 hover:shadow-md">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#203524] text-[#D1F470]"><FileText className="h-5 w-5" aria-hidden /></span>
      <span className="min-w-0 flex-1"><span className="block font-semibold text-[#11110D]">{title}</span><span className="mt-1 block text-sm leading-relaxed text-[#11110D]/60">{description}</span><span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#203524]">Download PDF <Download className="h-4 w-4 transition group-hover:translate-y-0.5" aria-hidden /></span></span>
    </a>
  );
}

export default function ResourceResporgNumberPorting() {
  const base = `${import.meta.env.BASE_URL}assets/amazon-connect-porting/`;
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "RespOrg & Number Porting | ZCC Depot";
    return () => { document.title = previousTitle; };
  }, []);
  return (
    <div className="resporg-porting-page">
      <style>{`
        .resporg-porting-page .section-brief-controls { display: none !important; }
        .porting-step-print-only { display: none; }
        @media print {
          @page { size: letter; margin: 0.55in; }
          html, body, #root { background: #fff !important; color: #11110D !important; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .depot-sidebar, .depot-topbar, .section-navigation { display: none !important; }
          .depot-content, .depot-main { margin: 0 !important; padding: 0 !important; }
          .resporg-porting-page { width: 100% !important; background: #fff !important; color: #11110D !important; }
          .resporg-porting-page .zhero-wrap { padding: 0 !important; background: #fff !important; }
          .resporg-porting-page .zhero { border-radius: 0 !important; box-shadow: none !important; }
          .resporg-porting-page .porting-page-print-button,
          .resporg-porting-page .section-brief-controls,
          .resporg-porting-page .porting-step-controls,
          .resporg-porting-page .porting-active-step { display: none !important; }
          .resporg-porting-page .porting-step-print-only { display: grid !important; gap: 0.15in; margin-top: 0.2in; padding-left: 0; list-style: none; }
          .resporg-porting-page .porting-step-print-only li,
          .resporg-porting-page article,
          .resporg-porting-page .rounded-2xl { break-inside: avoid; }
          .resporg-porting-page a { color: #203524 !important; text-decoration: underline !important; }
          .resporg-porting-page img, .resporg-porting-page svg { max-width: 100% !important; }
          .resporg-porting-page .porting-packet-motion { display: none !important; }
        }
      `}</style>
      <PageHero eyebrow="Resources · AWS telephony" title={<>RespOrg <span className="serif italic text-[#D1F470]">&amp; Number Porting</span></>} lede="A practical guide to AWS’s role in toll-free RespOrg management, number-portability checks, LOA preparation, carrier coordination, and cutover readiness.">
        <a href="#process" className="inline-flex items-center gap-2 rounded-full bg-[#D1F470] px-5 py-3 text-sm font-semibold text-[#11110D]">Explore the process <ArrowDown className="h-4 w-4" aria-hidden /></a>
        <button type="button" onClick={() => window.print()} className="porting-page-print-button inline-flex items-center gap-2 rounded-full border border-[#F5F5F2]/25 px-5 py-3 text-sm font-semibold text-[#F5F5F2] transition hover:border-[#D1F470] hover:text-[#D1F470]" aria-label="Print the complete RespOrg and Number Porting page as a PDF" data-testid="button-print-porting-page"><Printer className="h-4 w-4" aria-hidden />Print Page</button>
      </PageHero>

      <Section id="overview">
        <SectionHead permalinkId="overview" eyebrow="Start here" title="Portability is a carrier-coordinated change" lede="Porting moves a phone number from one provider to another while allowing you to keep the number customers already know. AWS evaluates the request and coordinates with the Connect Customer carrier and your current provider." />
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { title: "Check first", body: "Not every number is portable. Country rules, number type, carrier agreements, and your service contract can affect eligibility." },
            { title: "Allow time", body: "AWS currently estimates 2–4 weeks for US and Canada requests after eligibility and documentation are confirmed. Outside those countries, AWS gives a 2–6 month typical range." },
            { title: "Plan a cutover", body: "Most ports complete in 15–30 minutes, but carrier routing updates can cause brief disruption and may take longer in rare cases." },
          ].map((item) => <article key={item.title} className="rounded-2xl border border-[#203524]/15 bg-[#FBFBF8] p-5"><p className="eyebrow text-[#203524]/65">Porting snapshot</p><h3 className="mt-2 text-lg font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-[#11110D]/65">{item.body}</p></article>)}
        </div>
        <Note>These are AWS’s typical time ranges, not a guaranteed completion date. Country-specific requirements and the carriers’ mutually agreed port window control the actual schedule.</Note>
      </Section>

      <Section tone="white">
        <SectionHead id="process" num="01" eyebrow="Interactive process map" title="Follow the number from current service to Connect" lede="Choose a step to see what happens. The animated path shows the carrier handoff; the toll-free registry lane is separate from the carrier route." />
        <PortingFlow />
      </Section>

      <Section id="resporg">
        <SectionHead permalinkId="resporg" eyebrow="Toll-free number control" title="What a RespOrg does" lede="A Responsible Organization manages a subscriber’s North American toll-free number records in the centralized TFN Registry. A RespOrg can be a carrier or a non-carrier entity; the RespOrg record and the carrier carrying calls are separate roles." />
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[2rem] bg-[#203524] p-6 text-[#F5F5F2]"><p className="eyebrow text-[#D1F470]">Amazon Connect and toll-free numbers</p><p className="mt-3 text-sm leading-relaxed text-white/75">AWS manages US toll-free numbers as a RespOrg and registers a US toll-free number with SOMOS when it is claimed or ported into Connect Customer. AWS describes its US toll-free RespOrg configuration as supporting multi-carrier routing for resilience.</p></article>
          <article className="rounded-[2rem] border border-[#203524]/15 bg-[#FBFBF8] p-6"><p className="eyebrow text-[#203524]/65">How this differs from a DID</p><p className="mt-3 text-sm leading-relaxed text-[#11110D]/70">RespOrg is a toll-free registry role, not the name of a telephone carrier. The RespOrg concept applies to North American toll-free number records; DID porting follows the relevant carrier and country portability process.</p></article>
        </div>
        <div className="mt-4 rounded-2xl border border-[#D1F470]/60 bg-[#F0F6E5] p-5 text-sm leading-relaxed text-[#203524]">
          <strong>Cancellation checkpoint:</strong> AWS says a scheduled port can no longer be cancelled after the number has moved to the RespOrg. Contact AWS immediately if a date must change, and confirm the exact current status with the support team.
        </div>
        <Note>AWS’s published Service Level Agreement has specific toll-free RespOrg conditions for service-credit eligibility. Check the current SLA and support-plan requirements rather than treating RespOrg choice as a general availability guarantee.</Note>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Ext href="https://docs.aws.amazon.com/connect/latest/adminguide/concepts-telephony.html" className="font-semibold text-[#203524] underline">AWS: Voice channel and toll-free RespOrg</Ext>
          <Ext href="https://support.somos.com/hc/en-us/articles/6211557455380-TFNRegistry-API-Background" className="font-semibold text-[#203524] underline">SOMOS: Toll-free registry and RespOrg records</Ext>
          <Ext href="https://docs.fcc.gov/public/attachments/FCC-22-39A1.pdf" className="font-semibold text-[#203524] underline">FCC: RespOrg role overview</Ext>
          <Ext href="https://aws.amazon.com/products/connect/customer/sla0/" className="font-semibold text-[#203524] underline">AWS: Current Service Level Agreement</Ext>
        </div>
      </Section>

      <Section tone="white" id="loa">
        <SectionHead permalinkId="loa" eyebrow="Letter of Authorization" title="Prepare the LOA from the carrier record" lede="AWS supplies the LOA template after confirming the requested numbers can be ported. The losing carrier compares it with its service record, so exact matching matters." />
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { title: "Match the CSR", body: "Use the legal customer name, service address, carrier, and authorized contact exactly as shown on the current carrier’s Customer Service Record. Ask the current carrier for a CSR if you do not have one." },
            { title: "Use AWS’s form and timing", body: "Complete and sign the form AWS provides. AWS’s guide requires a legible LOA with a traditional handwritten signature and a date within 15 days of submission; check the current country-specific instructions." },
            { title: "Separate by carrier and country", body: "AWS requires a separate LOA for each losing carrier. Keep each LOA to numbers from one carrier and one country. Toll-free numbers can be included, up to 10 per LOA; AWS requires a spreadsheet when more than 10 numbers are requested." },
            { title: "Use secure document upload", body: "Do not attach personal documents to the initial support case. Wait for AWS’s secure S3 upload link and submit only the documents requested for your country and number type." },
          ].map((item) => <article key={item.title} className="rounded-2xl border border-[#203524]/15 bg-[#FBFBF8] p-5"><h3 className="font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-[#11110D]/65">{item.body}</p></article>)}
        </div>
        <div className="mt-4 rounded-2xl border border-[#203524]/15 bg-[#F7F0E5] p-5 text-sm leading-relaxed text-[#203524]">
          <strong>About the supplied sample:</strong> the attached sample form and completion guide contain fields and examples for a Vonage account. Fields such as BTN, account number, or PIN can be provider-specific. Use the AWS-provided LOA and the losing carrier’s exact records for your actual request.
        </div>
      </Section>

      <Section id="downloads">
        <SectionHead permalinkId="downloads" eyebrow="Download resources" title="LOA form and supporting references" lede="The LOA is a blank sample from the supplied files. The user guide and process guide are included for reference; the latter describes a Vonage-to-AWS example rather than a universal AWS timeline." />
        <div className="grid gap-3 lg:grid-cols-3">
          <DownloadCard href={`${base}Amazon_Connect_Number_Porting_LOA_Form.pdf`} filename="Amazon_Connect_Number_Porting_LOA_Form.pdf" title="Sample LOA form" description="Blank sample letter of authorization supplied for this page. AWS may provide a different country-specific form." testId="download-porting-loa" />
          <DownloadCard href={`${base}Amazon_Connect_Number_Porting_User_Guide.pdf`} filename="Amazon_Connect_Number_Porting_User_Guide.pdf" title="LOA completion guide" description="Field-by-field guidance using a Vonage account example. Use only fields that match your carrier’s record." testId="download-porting-user-guide" />
          <DownloadCard href={`${base}Amazon_Connect_Number_Porting_Process.pdf`} filename="Amazon_Connect_Number_Porting_Process.pdf" title="Number porting process guide" description="A Vonage-to-AWS process example with readiness and cutover checklists. Actual steps and timing vary by carrier and country." testId="download-porting-process-guide" />
        </div>
      </Section>

      <Section tone="white">
        <SectionHead eyebrow="AWS references" title="Check the current requirements before you submit" lede="Eligibility, documentation, timing, and cutover windows vary. Use AWS’s current guide and country-specific requirements for each request." />
        <ul className="grid gap-3 md:grid-cols-2">
          {[
            ["AWS porting process", "https://docs.aws.amazon.com/connect/latest/adminguide/about-porting.html"],
            ["What number porting means", "https://docs.aws.amazon.com/connect/latest/adminguide/what-is-phone-number-porting.html"],
            ["Which numbers can be ported", "https://docs.aws.amazon.com/connect/latest/adminguide/what-numbers-can-be-ported.html"],
            ["Country and regional requirements", "https://docs.aws.amazon.com/connect/latest/adminguide/phone-number-requirements.html"],
            ["LOA and common rejection reasons", "https://docs.aws.amazon.com/connect/latest/adminguide/porting-documentation-requirements.html"],
            ["Porting timelines", "https://docs.aws.amazon.com/connect/latest/adminguide/how-long-for-number-porting.html"],
            ["Port-day checklist", "https://docs.aws.amazon.com/connect/latest/adminguide/about-porting.html"],
          ].map(([label, href]) => <li key={href} className="rounded-2xl border border-[#203524]/15 bg-[#FBFBF8] p-4"><Ext href={href} className="font-semibold text-[#203524] underline">{label}</Ext></li>)}
        </ul>
        <Note>Administrative labels in AWS documentation may vary by country or change over time. The AWS Support case and your AWS-provided LOA are authoritative for the current request.</Note>
      </Section>
    </div>
  );
}
