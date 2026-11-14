import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { RoomFrame, RoomSection, SourceNote, StatusTag } from "@/components/room-kit";
import { ArchExplorer } from "@/components/arch-explorer";
import { SystemDataFlow } from "@/components/system-data-flow";
import { ZendeskPodMap } from "@/components/zendesk-pod-map";
import { Ext } from "@/components/kit";
import { ACCURACY_NOTES, CORE_COMPONENTS, LAMBDAS, LINKS, RESOURCES } from "@/data/content";

const CALL_TO_TICKET = [
  { t: "Contact flow sets attributes", d: "IVR selections, account identifiers, and intent results are stored as Amazon Connect contact attributes.", ref: "attributes-call-info" },
  { t: "Caller lookup", d: "During the live call, a Lambda helper searches Zendesk for the caller's ticket or contact record.", ref: "calls-tickets" },
  { t: "Agent accepts in Workspace", d: "Call controls and the ticket open together in Agent Workspace; displayed attributes appear to the agent.", ref: "display-attributes" },
  { t: "Ticket created or updated", d: "The call is associated with a ticket. Mapped attributes populate fields according to configuration.", ref: "calls-tickets" },
  { t: "Post-call writeback", d: "After the call, CTRs are processed; recordings and transcripts are attached where those features are enabled.", ref: "aws-services" },
];

const DEPLOY = [
  { t: "Account and region", d: "Choose the AWS account and region for the Connect instance. Region influences data residency and latency." },
  { t: "Permissions", d: "The deploying identity needs rights to create IAM roles, Lambda functions, Cognito resources, and streaming connections." },
  { t: "Storage discovery", d: "Deployment helpers read Connect storage settings, bucket names, KMS keys, Kinesis streams, and the Customer Profiles domain." },
  { t: "Change management", d: "Treat the stack as customer infrastructure: plan updates, review IAM changes, and align with the customer's release process." },
];

export default function ArchitectureIntegrations() {
  const [fn, setFn] = useState<"runtime" | "deployment">("runtime");
  const doc = (id: string) => RESOURCES.find((r) => r.id === id);
  return (
    <RoomFrame id="architecture-integrations" lede="Explore the Amazon Connect foundation, Zendesk integration points and deployment-specific identity and data boundaries." actions={<><Link href="/architecture/system-overview" className="room-chip" data-testid="link-system-overview-page">Detailed system overview<ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link><Link href="/architecture/components" className="room-chip" data-testid="link-components-page">Component deep dive<ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link></>}>
      <SourceNote>{ACCURACY_NOTES.awsOwnership} <Ext href={LINKS.managedAws} className="underline">Zendesk-managed AWS</Ext>{" · "}<Ext href={LINKS.customerAws} className="underline">Customer-managed AWS</Ext></SourceNote>
      <RoomSection id="zendesk-architecture-overview" eyebrow="Zendesk Architecture Overview" title="Global Pods on AWS, built to contain incidents" lede="Select a reference location, then simulate a local incident to see the Pod isolation idea. Illustrative, not live status.">
        <ZendeskPodMap />
        <Link href="/architecture/system-overview" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#111317] underline" data-testid="link-system-overview-from-pods">Continue to the Detailed System Overview<ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </RoomSection>

      <RoomSection id="explorer" eyebrow="Architecture explorer" title="The system, one layer at a time" lede="Drag to pan, zoom with the controls, toggle layers, or run the guided tour. Dashed items are conceptual or configuration-dependent.">
        <ArchExplorer brands variant="reference" />
        <Link href="/architecture/system-overview" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D9DCE0] bg-[#FCFCFB] px-5 py-4 hover:border-[#111317]" data-testid="link-system-overview-banner"><span><span className="block text-xs font-bold uppercase tracking-wider text-[#E0352B]">New</span><span className="block text-lg font-extrabold text-[#111317]">Detailed System Overview & Data Flow</span><span className="block text-sm text-[#111317]/65">Zendesk environment, customer AWS boundary, identity chain, and post-call records in one diagram.</span></span><ArrowRight className="h-5 w-5" aria-hidden /></Link>
      </RoomSection>

      <RoomSection id="call-to-ticket" eyebrow="Call to ticket" title="How call metadata becomes ticket data" tone="panel">
        <ol className="grid gap-3 md:grid-cols-5">
          {CALL_TO_TICKET.map((s, i) => {
            const r = doc(s.ref);
            return (
              <li key={s.t} className="depot-card is-step">
                <div className="mono text-xs text-[#11110D]/40">0{i + 1}</div>
                <h3 className="mt-2 font-semibold leading-snug">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#11110D]/65">{s.d}</p>
                {r && <Ext href={r.url} className="mt-3 text-xs font-medium underline" testId={`link-doc-${s.ref}-${i}`}>Documentation</Ext>}
              </li>
            );
          })}
        </ol>
        <SourceNote>Exact field mapping and writeback depend on configuration and enabled features.</SourceNote>
      </RoomSection>

      <RoomSection id="identity" eyebrow="Identity and access" title="Who signs in where">
        <div className="grid gap-3 lg:grid-cols-4">
          {CORE_COMPONENTS.map((c) => (
            <div key={c.n} className="depot-card">
              <div className="mono text-xs text-[#11110D]/40">{c.n}</div>
              <h3 className="mt-2 font-semibold">{c.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#11110D]/65">{c.d}</p>
              <div className="mt-3 flex flex-wrap gap-1">{c.chips.map((x) => <span key={x} className="room-tag">{x}</span>)}</div>
            </div>
          ))}
        </div>
        <SourceNote>Based on <Ext href={LINKS.components} className="underline">Understanding Contact Center components</Ext>. MFA policy is enforced by the corporate identity provider.</SourceNote>
      </RoomSection>

      <RoomSection id="deployment" eyebrow="CloudFormation" title="Deployment considerations" lede="What to raise with the customer's cloud team before the first stack is created." tone="panel">
        <div className="grid gap-3 md:grid-cols-2">
          {DEPLOY.map((d, i) => <div key={d.t} className="depot-card flex gap-4"><span className="room-index">{i + 1}</span><div><h3 className="font-semibold">{d.t}</h3><p className="mt-1 text-sm leading-relaxed text-[#11110D]/65">{d.d}</p></div></div>)}
        </div>
        <SourceNote>See <Ext href={LINKS.install} className="underline">Implementing Zendesk Contact Center</Ext> and <Ext href={LINKS.awsServices} className="underline">About AWS services in Contact Center</Ext>.</SourceNote>
      </RoomSection>

      <RoomSection id="integration-lambdas" eyebrow="Integration functions" title="Lambda functions in the stack">
        <div className="depot-mode is-light mb-4 w-max" role="radiogroup" aria-label="Function group">
          <button type="button" role="radio" aria-checked={fn === "runtime"} onClick={() => setFn("runtime")} className={fn === "runtime" ? "is-on" : ""} data-testid="button-lambdas-runtime">Runtime ({LAMBDAS.runtime.length})</button>
          <button type="button" role="radio" aria-checked={fn === "deployment"} onClick={() => setFn("deployment")} className={fn === "deployment" ? "is-on" : ""} data-testid="button-lambdas-deployment">Deployment ({LAMBDAS.deployment.length})</button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#11110D]/4"><tr><th className="px-4 py-2.5 font-semibold">Function</th><th className="px-4 py-2.5 font-semibold">Role</th></tr></thead>
            <tbody>{LAMBDAS[fn].map((l) => <tr key={l.n} className="border-t border-[#11110D]/8"><td className="mono whitespace-nowrap px-4 py-3 align-top text-xs">{l.n}</td><td className="px-4 py-3 text-[#11110D]/72">{l.d}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-2"><StatusTag s="Documented" /><span className="text-xs text-[#11110D]/55">Function names per Zendesk AWS services documentation; confirm against the deployed template version.</span></div>
      </RoomSection>

      <RoomSection id="live-flow" eyebrow="Live data flow" title="Trace agent controls, context, and records">
        <div className="rounded-[1.5rem] bg-[#11110D] p-4 md:p-6"><SystemDataFlow /></div>
      </RoomSection>
    </RoomFrame>
  );
}
