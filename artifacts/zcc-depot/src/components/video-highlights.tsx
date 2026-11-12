import { PlayCircle } from "lucide-react";
import { Ext, Note, Section, SectionHead } from "@/components/kit";
import { VIDEO_HIGHLIGHTS, WALKTHROUGH_URL } from "@/data/video-highlights";

export function VideoHighlights() {
  return (
    <Section tone="white">
      <div id="video-highlights" className="scroll-mt-28">
        <SectionHead num="01" eyebrow="Recorded walkthrough" title="Watch the journey. Find the moment."
          lede="Eight timestamped highlights from Call Center Power’s Zendesk Contact Center walkthrough, with matching paraphrased transcript passages." />
      </div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-[#203524] p-6 text-[#F5F5F2] md:p-8">
        <div className="max-w-2xl">
          <p className="eyebrow text-[#D1F470]">Call Center Power · approximately 33:52</p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight md:text-2xl">Zendesk Contact Center Demo — Full Platform Walkthrough</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#F5F5F2]/70">A partner-configured Zendesk and Amazon Connect journey across voice AI, human handoff, chat, analytics, and implementation.</p>
        </div>
        <Ext href={WALKTHROUGH_URL} testId="link-full-video"
          className="rounded-full bg-[#D1F470] px-5 py-3 text-sm font-semibold text-[#11110D] transition-colors hover:bg-[#c3ea55]">
          <PlayCircle className="h-4 w-4" aria-hidden /> Watch full video
        </Ext>
      </div>
      <ol className="grid gap-5 md:grid-cols-2" aria-label="Timestamped video highlights">
        {VIDEO_HIGHLIGHTS.map((item, index) => (
          <li key={item.start} className="flex flex-col rounded-3xl border border-[#203524]/15 bg-[#F5F5F2] p-6 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="mono text-xs text-[#203524]/50">Highlight {String(index + 1).padStart(2, "0")}</span>
              <Ext href={`${WALKTHROUGH_URL}&t=${item.start}s`} testId={`link-video-highlight-${index + 1}`}
                className="rounded-full bg-[#D1F470]/60 px-3 py-2 mono text-xs font-medium text-[#203524] transition-colors hover:bg-[#D1F470]">
                <span className="sr-only">Watch {item.title} at </span>{item.time}
              </Ext>
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">{item.title}</h3>
            <p className="mb-5 mt-3 text-[15px] leading-relaxed text-[#11110D]/70">{item.highlight}</p>
            <details className="mt-auto border-t border-[#203524]/15 pt-4">
              <summary className="cursor-pointer text-sm font-semibold text-[#203524] marker:text-[#203524]/50">Transcript digest · paraphrased</summary>
              <p className="mt-3 text-sm leading-relaxed text-[#11110D]/70">{item.transcript}</p>
            </details>
          </li>
        ))}
      </ol>
      <Note>
        Based on English auto-generated captions, not a frame-by-frame visual review. These passages are paraphrases, not a verbatim transcript. For the original captions, open the video on YouTube and select Show transcript.
        This is a partner-configured sales demonstration: capabilities are not necessarily native to Zendesk or included in every subscription. Pricing, licensing, reliability, and security claims were not independently verified. Phone-number recognition shown in the demo does not establish a complete authentication design.
      </Note>
    </Section>
  );
}
