import { useState, type MouseEvent } from "react";
import { Link } from "wouter";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { AlertTriangle, ArrowUpRight, ChevronLeft, ChevronRight, LayoutGrid, Maximize2, Minimize2, X } from "lucide-react";
import { ErrorBoundary, type ErrorFallbackProps } from "@/components/error-boundary";
import { Ext } from "@/components/kit";
import { FEATURE_CATEGORIES, FEATURE_CLASSIFICATIONS, type EnterpriseFeature } from "@/data/feature-types";
import { FeatureIcon } from "./feature-icon";
import { FeatureSimulation } from "./feature-simulation";
import { FeatureArchitectureView } from "./feature-architecture";
import { FeaturePresenterNotes } from "./feature-presenter-notes";
import { ClassChips, VerifiedDate } from "./feature-bits";
import { FEATURE_REGISTRY, featureHref } from "@/data/feature-registry";
import { evidenceIssues, relatedFeatures } from "@/data/feature-evidence";
import "@/components/demo-readiness.css";

const EV_LABEL = { "documentation-reviewed": "Documentation reviewed", "requires-verification": "Requires verification", "missing-evidence": "Missing evidence" } as const;
export function EvidenceChip({ status }: { status: EnterpriseFeature["evidence"]["status"] }) {
  return <span className={`ev-chip ev-${status}`} data-testid={`status-evidence-${status}`}>{EV_LABEL[status]}</span>;
}
function plainClick(e: MouseEvent) { return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey; }

const TABS = [["overview", "Overview"], ["value", "Business Value"], ["demo", "Interactive Demo"], ["architecture", "Architecture"], ["configuration", "Configuration"], ["docs", "Documentation"]] as const;
export type Tab = typeof TABS[number][0];

function DemoFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="fx-empty" role="alert">
      <AlertTriangle className="mx-auto h-6 w-6 text-[#a2361f]" aria-hidden />
      <p className="mt-2 font-semibold">This view hit a problem.</p>
      <p className="mt-1 text-sm text-[#11110D]/60">The rest of the explorer is unaffected.</p>
      <button type="button" className="fx-btn fx-btn-ink mt-3" onClick={resetError} data-testid="button-retry-view">Try again</button>
    </div>
  );
}

export function FeatureDetail({ feature, onClose, onPrev, onNext, position, tab, setTab, onReturnFocus, onOpenRelated }: { onOpenRelated?: (id: string) => void; tab: Tab; setTab: (t: Tab) => void; feature: EnterpriseFeature | null; onClose: () => void; onPrev?: () => void; onNext?: () => void; position: string; onReturnFocus: () => void }) {
  const [full, setFull] = useState(false);
  return (
    <Dialog.Root open={!!feature} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[120] bg-[#11110D]/55 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        {feature && (
          <Dialog.Content onCloseAutoFocus={(event) => { event.preventDefault(); onReturnFocus(); }} className={`fx fx-dialog fixed left-1/2 top-1/2 z-[121] -translate-x-1/2 -translate-y-1/2 focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] ${full ? "is-full" : ""}`} data-testid="dialog-feature" aria-describedby={`fx-desc-${feature.id}`}>
            <header className="fx-head on-dark">
              <div className="fx-heading relative flex items-start gap-3">
                <span className="fx-icon !bg-[#D1F470] !text-[#11110D]"><FeatureIcon name={feature.icon} /></span>
                <div className="fx-heading-copy min-w-0 flex-1">
                  <div className="eyebrow text-[0.62rem] text-[#D1F470]/80">{feature.categories.map((c) => FEATURE_CATEGORIES.find((x) => x.id === c)?.label).filter(Boolean).join(" / ")}<span className="ml-2 text-[#F5F5F2]/40">{position}</span></div>
                  <Dialog.Title className="mt-0.5 text-xl font-semibold tracking-tight md:text-2xl" data-testid="text-feature-title">{feature.title}</Dialog.Title>
                  <Dialog.Description id={`fx-desc-${feature.id}`} className="fx-heading-description mt-1 max-w-3xl text-sm text-[#F5F5F2]/72">{feature.description}</Dialog.Description>
                </div>
                <div className="fx-head-controls flex shrink-0 gap-1.5">
                  <button type="button" className="fx-headbtn" onClick={onPrev} disabled={!onPrev} aria-label="Previous feature" data-testid="button-feature-prev"><ChevronLeft className="h-4 w-4" aria-hidden /></button>
                  <button type="button" className="fx-headbtn" onClick={onNext} disabled={!onNext} aria-label="Next feature" data-testid="button-feature-next"><ChevronRight className="h-4 w-4" aria-hidden /></button>
                  <button type="button" className="fx-headbtn fx-desktop-only" onClick={() => setFull((v) => !v)} aria-label={full ? "Exit fullscreen" : "Fullscreen"} aria-pressed={full} data-testid="button-feature-fullscreen">{full ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}</button>
                  <Dialog.Close className="fx-headbtn" aria-label="Close and return to features" data-testid="button-feature-close"><X className="h-4 w-4" aria-hidden /></Dialog.Close>
                </div>
              </div>
              <div className="relative mt-2"><ClassChips feature={feature} dark /></div>
            </header>
            <Tabs.Root value={tab} onValueChange={(v) => setTab(v as Tab)} className="flex min-h-0 flex-1 flex-col">
              <Tabs.List className="fx-tabs" aria-label="Feature views">
                {TABS.map(([v, l]) => <Tabs.Trigger key={v} value={v} className="fx-tab" data-testid={`tab-feature-${v}`}>{l}</Tabs.Trigger>)}
              </Tabs.List>
              <div className="fx-body">
                <ErrorBoundary resetKey={feature.id + tab} FallbackComponent={DemoFallback}>
                  <Tabs.Content value="overview" className="space-y-3 focus:outline-none">
                    <p className="max-w-3xl text-[0.95rem] leading-relaxed">{feature.overview}</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="fx-panel"><div className="fx-h">Customer problem</div><p className="text-sm">{feature.customerProblem}</p></div>
                      <div className="fx-panel !bg-[#ECF7C8]"><div className="fx-h">Outcome</div><p className="text-sm">{feature.outcome}</p></div>
                    </div>
                    <div className="fx-panel"><div className="fx-h">Availability</div><p className="text-sm">{feature.availability}</p><div className="mt-2"><VerifiedDate date={feature.lastVerified} /></div></div>
                    {feature.legacy && (
                      <div className="fx-panel"><div className="fx-h">Original depot brief</div><p className="font-semibold">{feature.legacy.title}</p><p className="mt-1 text-sm text-[#11110D]/72">{feature.legacy.description}</p>
                        <p className="mt-2 text-xs">{feature.legacy.sources.map((s, i) => <span key={s.href}>{i > 0 && " · "}<Ext href={s.href} className="underline">{s.label}</Ext></span>)}</p></div>
                    )}
                    <FeaturePresenterNotes featureId={feature.id} />
                    {(() => { const rel = relatedFeatures(feature, FEATURE_REGISTRY); return rel.length > 0 && (
                      <nav aria-label="Related features"><div className="fx-h">Related features</div>
                        <div className="fx-related">{rel.map((r) => (
                          <a key={r.id} href={featureHref(r.id)} onClick={(e) => { if (onOpenRelated && plainClick(e)) { e.preventDefault(); onOpenRelated(r.id); } }} data-testid={`link-related-feature-${r.id}`}>
                            <span className="block text-sm font-semibold">{r.title}</span><span className="mt-1 block"><EvidenceChip status={r.evidence.status} /></span>
                          </a>))}</div>
                      </nav>); })()}
                  </Tabs.Content>
                  <Tabs.Content value="value" className="space-y-3 focus:outline-none">
                    <div className="fx-panel"><div className="fx-h">Benefits</div><ul className="grid gap-1.5 text-sm md:grid-cols-2">{feature.benefits.map((b) => <li key={b} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#203524]" />{b}</li>)}</ul></div>
                    <div className="grid gap-3 md:grid-cols-2">{feature.useCases.map((u) => <div key={u.title} className="fx-panel"><p className="font-semibold">{u.title}</p><p className="mt-1 text-sm text-[#11110D]/72">{u.description}</p></div>)}</div>
                    {feature.industries.length > 0 && <div className="flex flex-wrap gap-1.5"><span className="fx-h !mb-0 mr-1 self-center">Industries</span>{feature.industries.map((i) => <span key={i} className="room-tag">{i}</span>)}</div>}
                  </Tabs.Content>
                  <Tabs.Content value="demo" className="focus:outline-none"><FeatureSimulation key={feature.id} feature={feature} /></Tabs.Content>
                  <Tabs.Content value="architecture" className="focus:outline-none"><FeatureArchitectureView key={feature.id} arch={feature.architecture} featureId={feature.id} /></Tabs.Content>
                  <Tabs.Content value="configuration" className="space-y-2 focus:outline-none">
                    {feature.configuration.length === 0 ? <div className="fx-empty text-sm">Configuration steps have not been published for this feature.</div>
                      : <ol className="space-y-2">{feature.configuration.map((c, i) => <li key={c.title} className="fx-panel flex gap-3"><span className="room-index">{i + 1}</span><div><p className="font-semibold">{c.title}</p><p className="mt-0.5 text-sm text-[#11110D]/72">{c.detail}</p></div></li>)}</ol>}
                    <p className="text-xs text-[#11110D]/55">Configuration is indicative. Confirm prerequisites, entitlements and regional support for each deployment.</p>
                  </Tabs.Content>
                  <Tabs.Content value="docs" className="space-y-3 focus:outline-none">
                    {(() => { const ev = feature.evidence; const issues = evidenceIssues(feature); return (
                      <div className="fx-panel" data-testid="panel-feature-evidence"><div className="mb-2 flex flex-wrap items-center gap-2"><div className="fx-h !mb-0">Evidence status</div><EvidenceChip status={ev.status} /></div>
                        <dl className="ev-dl">
                          <div><dt>Owner</dt><dd>{ev.owner ?? <span className="text-[#a2361f]">Unassigned</span>}</dd></div>
                          <div><dt>Documentation review</dt><dd>{ev.reviewedAt ? <VerifiedDate date={ev.reviewedAt} /> : <span className="text-[#a2361f]">No review date recorded</span>}</dd></div>
                          <div><dt>Product boundary</dt><dd>{ev.productBoundary.length ? ev.productBoundary.join(" · ") : "Not recorded"}</dd></div>
                          <div><dt>Dependencies</dt><dd>{ev.dependencies.length ? ev.dependencies.join(" · ") : "None recorded"}</dd></div>
                          <div><dt>Availability</dt><dd>{ev.availabilityQualification || feature.availability}</dd></div>
                          <div><dt>Human approval</dt><dd>{ev.humanApproval ?? "Not recorded. No approval is implied."}</dd></div>
                        </dl>
                        {issues.length > 0 && <p className="mt-2 text-xs"><span className="font-semibold">Needs attention: </span>{issues.map((i) => <span key={i} className="ev-reason">{i}</span>)}</p>}
                      </div>); })()}
                    <div className="fx-panel"><div className="fx-h">Classifications</div>
                      <ul className="space-y-1.5 text-sm">{feature.classifications.map((c) => <li key={c}><span className="font-semibold">{c}.</span> <span className="text-[#11110D]/70">{FEATURE_CLASSIFICATIONS.find((x) => x.value === c)?.description}</span></li>)}</ul></div>
                    <div className="fx-panel"><div className="fx-h">Sources</div>
                      {feature.sources.length === 0 ? <p className="text-sm text-[#a2361f]">No sources recorded. Treat this feature as unverified.</p> :
                        <ul className="space-y-2">{feature.sources.map((s) => <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><Ext href={s.href} className="font-semibold underline underline-offset-2" testId={`link-source-${s.id}`}>{s.label}</Ext><VerifiedDate date={s.lastVerified} /></li>)}</ul>}
                      <p className="mt-3 text-xs text-[#11110D]/55">Review dates record when the documented claim was last checked against its source. They are not evidence that any customer deployment was validated.</p>
                    </div>
                  </Tabs.Content>
                </ErrorBoundary>
              </div>
            </Tabs.Root>
            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#11110D]/10 bg-[#FBFBF8] px-4 py-2.5">
              <Dialog.Close className="fx-btn fx-btn-ghost" data-testid="button-return-grid"><LayoutGrid className="h-4 w-4" aria-hidden />Return to feature grid</Dialog.Close>
              {feature.demo.href && <Link href={feature.demo.href} className="fx-btn fx-btn-ink" data-testid="link-feature-full-lab">{feature.demo.label}<ArrowUpRight className="h-4 w-4" aria-hidden /></Link>}
            </footer>
          </Dialog.Content>
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
}
