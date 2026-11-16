import { useEffect } from "react";
import { ArrowRight, ArrowUpRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Ext, Note, PageHero, Section, SectionHead } from "@/components/kit";

const GUIDE_URL = "https://chatgpt.com/library?file_id=76b2e7e3d4a48191baa6e70412160970&account_id=618a18bb-bc3f-40fb-8038-6e35a18fb181";

const steps = [
  ["01", "Confirm scope", "Zendesk confirms which AWS account and Regions are in scope, and whether an AWS Organizations dependency check is needed."],
  ["02", "Check organization dependencies", "If Zendesk requests it, the customer’s AWS administrator runs the organization assessment and shares the results through an agreed secure channel."],
  ["03", "Build the resource inventory", "The customer prepares an inventory with AWS Resource Explorer (recommended) or AWS Config. AWS Config may add charges; confirm costs before enabling it."],
  ["04", "Prepare temporary access", "The customer sets up the agreed access method, usually a temporary cross-account IAM role or existing SSO/federation. Scope it to the target account and Regions."],
  ["05", "Run the account audit", "A Zendesk assessor runs the supplied audit script locally, reviews the inventory, and records compatibility findings."],
  ["06", "Review readiness findings", "The teams discuss dependencies, exceptions, risks, and any information still needed to make a hosting decision."],
  ["07", "Agree the next plan", "If both teams decide to proceed, they separately define the migration approach, owners, timing, and change controls."],
  ["08", "Remove temporary access", "After the assessment, the customer removes temporary access and any resources created only to support inventory collection."],
];

const roles = [
  { title: "Customer team", items: ["Confirm the account and Regions", "Prepare the resource inventory", "Create and remove the agreed temporary access", "Share findings through the approved secure channel"] },
  { title: "Zendesk assessment team", items: ["Confirm whether the organization check is needed", "Provide the audit instructions", "Run and review the account audit", "Explain findings and readiness considerations"] },
];

export default function ResourceAwsAccountMigration() {
  useEffect(() => {
    const previous = document.title;
    document.title = "AWS Account Migration Assessment | ZCC Depot";
    return () => { document.title = previous; };
  }, []);

  return <>
    <PageHero eyebrow="Resources · AWS account readiness" title={<>AWS Account <span className="serif italic text-[#D1F470]">Migration Assessment</span></>}
      lede="A clear, customer-friendly view of the preparation and review steps used to assess an AWS account before a separate migration decision.">
      <a href="#assessment-process" className="rounded-full bg-[#D1F470] px-5 py-3 text-sm font-semibold text-[#11110D]">Explore the process<ArrowRight className="ml-2 inline h-4 w-4" aria-hidden /></a>
      <a href={GUIDE_URL} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#F5F5F2]/25 px-5 py-3 text-sm font-semibold hover:border-[#D1F470] hover:text-[#D1F470]">Open preparation guide (PDF)<ArrowUpRight className="ml-2 inline h-4 w-4" aria-hidden /></a>
    </PageHero>

    <Section id="assessment-process">
      <SectionHead permalinkId="assessment-process" num="01" eyebrow="Assessment journey" title="Prepare. Review. Decide." lede="The assessment gathers information and identifies considerations. It does not itself migrate workloads or authorize a migration." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(([number, title, description]) => <article key={number} className="rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8] p-5 md:p-6">
          <div className="mono text-xs font-semibold tracking-widest text-[#203524]/60">{number}</div>
          <h3 className="mt-3 text-lg font-semibold tracking-tight">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#11110D]/70">{description}</p>
        </article>)}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {roles.map(role => <div key={role.title} className="rounded-3xl bg-[#203524] p-6 text-[#F5F5F2]">
          <h3 className="text-lg font-semibold text-[#D1F470]">{role.title}</h3>
          <ul className="mt-4 grid gap-2">{role.items.map(item => <li key={item} className="flex gap-2 text-sm leading-relaxed text-[#F5F5F2]/80"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D1F470]" aria-hidden />{item}</li>)}</ul>
        </div>)}
      </div>
    </Section>

    <Section tone="forest">
      <SectionHead eyebrow="Security and scope" dark title="Designed to review, not change workloads" lede="Follow the access and data-sharing plan agreed for the assessment. Use the supplied guide for the exact preparation requirements." />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-[#F5F5F2]/15 p-6"><ShieldCheck className="h-6 w-6 text-[#D1F470]" aria-hidden /><h3 className="mt-4 font-semibold">Least-privilege access</h3><p className="mt-2 text-sm leading-relaxed text-[#F5F5F2]/70">Use temporary, scoped access where possible. The guide describes read-focused permissions with limited setup permissions where inventory tools need them.</p></div>
        <div className="rounded-3xl border border-[#F5F5F2]/15 p-6"><h3 className="font-semibold text-[#D1F470]">No agent installed</h3><p className="mt-2 text-sm leading-relaxed text-[#F5F5F2]/70">The documented assessment does not install an agent or modify or delete customer workloads.</p></div>
        <div className="rounded-3xl border border-[#F5F5F2]/15 p-6"><h3 className="font-semibold text-[#D1F470]">Keep credentials private</h3><p className="mt-2 text-sm leading-relaxed text-[#F5F5F2]/70">Agree on a secure report-sharing channel. Do not email access keys or other credentials.</p></div>
      </div>
      <Note>Use the customer preparation guide as the source of truth for scope, permissions, and commands. Resource Explorer is the recommended inventory option in the guide; AWS Config can incur charges and does not recreate historical configurations.</Note>
    </Section>

    <Section>
      <SectionHead eyebrow="Source document" title="Use the full preparation guide" lede="Open the attached customer guide for the detailed prerequisites, inventory options, access paths, and assessment instructions." />
      <Ext href={GUIDE_URL} className="inline-flex items-center gap-2 rounded-full bg-[#203524] px-5 py-3 text-sm font-semibold text-[#D1F470]">Open AWS Account Migration Assessment guide (PDF)<ArrowUpRight className="h-4 w-4" aria-hidden /></Ext>
    </Section>
  </>;
}
