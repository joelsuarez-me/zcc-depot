import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, FileText, RefreshCw } from "lucide-react";
import { Note, PageHero, Section, SectionHead } from "@/components/kit";

const SOURCE_PDF = "https://d1v2gagwb6hfe1.cloudfront.net/Amazon_Connect_Telecoms_Coverage.pdf";
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

export default function ResourceAmazonConnectCoverage() {
  const [sourceRevision, setSourceRevision] = useState(() => Date.now());
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const pdfUrl = `${SOURCE_PDF}?refresh=${sourceRevision}`;

  useEffect(() => {
    const previousTitle = document.title;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content") ?? null;
    document.title = "Amazon Connect Telecom Country Coverage | ZCC Depot";
    meta?.setAttribute("content", "View the live AWS Amazon Connect Telecoms Country Coverage Guide, with country-level DID, toll-free, porting and multi-carrier availability.");
    return () => {
      document.title = previousTitle;
      if (meta && previousDescription !== null) meta.setAttribute("content", previousDescription);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLoadedAt(null);
      setSourceRevision(Date.now());
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  const refreshSource = () => {
    setLoadedAt(null);
    setSourceRevision(Date.now());
  };

  return (
    <div>
      <PageHero eyebrow="Resources · AWS telephony" title="Amazon Connect Telecom Country Coverage"
        lede="A live view of AWS's official telecoms country coverage guide, including DID and toll-free number availability and carrier options.">
        <a href="#coverage-guide" className="room-chip" data-testid="link-hero-coverage">View coverage guide<ArrowDown className="h-3.5 w-3.5" aria-hidden /></a>
        <a href={SOURCE_PDF} target="_blank" rel="noopener noreferrer" className="room-chip" data-testid="link-open-aws-coverage">Open AWS PDF<ArrowUpRight className="h-3.5 w-3.5" aria-hidden /><span className="sr-only"> (opens in a new tab)</span></a>
      </PageHero>

      <Section id="coverage-guide">
        <SectionHead permalinkId="coverage-guide" eyebrow="Live AWS source" title="Telecoms Country Coverage Guide"
          lede="The guide below loads directly from AWS. It refreshes when this page opens, checks for updates every 15 minutes while open, and can be refreshed at any time." />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#203524]/15 bg-[#FBFBF8] p-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#D1F470]/60 text-[#203524]"><FileText className="h-5 w-5" aria-hidden /></span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Source: Amazon Connect Telecoms Country Coverage Guide</p>
              <p className="mt-1 text-xs text-[#11110D]/60" aria-live="polite" data-testid="text-coverage-sync-status">
                {loadedAt ? `AWS PDF loaded at ${new Date(loadedAt).toLocaleTimeString()} · automatic refresh every 15 minutes` : "Loading the latest AWS PDF…"}
              </p>
            </div>
          </div>
          <button type="button" onClick={refreshSource} className="inline-flex items-center gap-2 rounded-full border border-[#203524]/20 px-4 py-2 text-sm font-semibold text-[#203524] transition hover:border-[#203524] hover:bg-[#203524]/5" data-testid="button-refresh-coverage">
            <RefreshCw className="h-4 w-4" aria-hidden />Refresh source
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#11110D]/15 bg-[#FBFBF8] shadow-sm">
          <iframe key={sourceRevision} src={pdfUrl} title="Live AWS Amazon Connect Telecoms Country Coverage Guide"
            className="h-[78vh] min-h-[34rem] w-full" onLoad={() => setLoadedAt(Date.now())} />
        </div>
        <Note>This page embeds the AWS guide itself, so its country rows and coverage indicators come from the source document rather than a separately maintained copy. Confirm the guide's own last-updated date and country-specific requirements before making availability or carrier-resiliency commitments.</Note>
      </Section>
    </div>
  );
}
