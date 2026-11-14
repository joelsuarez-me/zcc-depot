import { Ext } from "@/components/kit";
import { SLIDES, type SlideId } from "@/data/how-it-works";
import {
  ASSESSMENT_LABELS, REVIEW_SOURCES, SECTION_REVIEWS, SOURCE_CHECKED_ON, SOURCE_ERA,
} from "@/data/how-it-works-reviews";

export function SourceReviewRegister() {
  const approved = Object.values(SECTION_REVIEWS).filter((r) => r.humanReview.status === "approved").length;
  return (
    <aside id="source-review-register" aria-labelledby="source-review-title" className="hiw-review mt-6" data-testid="source-review-register">
      <h2 id="source-review-title" className="text-lg font-semibold">Historical guide + current source reviews</h2>
      <p className="mt-2 text-sm leading-relaxed">
        <strong>Guide era: {SOURCE_ERA}.</strong> Diagrams, examples and comparison marks below preserve the deck’s historical perspective.
        They are not a current feature inventory. A blank comparison cell means “not indicated in source”, not “unsupported”.
      </p>
      <p className="mt-2 text-sm leading-relaxed">
        <strong>Documentation checked: <time dateTime={SOURCE_CHECKED_ON}>{SOURCE_CHECKED_ON}</time>.</strong>{" "}
        {Object.keys(REVIEW_SOURCES).length} official Zendesk/AWS documents inform capability notes keyed to all {SLIDES.length} sections.
        Each note explains what its sources support, qualify or do not establish. Source checks are a dated snapshot, not continuous monitoring or customer-environment validation.
      </p>
      <p className="mt-2 text-sm leading-relaxed" data-testid="text-human-review-status">
        <strong>Human approval: {approved} of {SLIDES.length} sections.</strong>{" "}
        {approved < SLIDES.length
          ? "The difference notes are AI-assisted editorial assessments awaiting a human product reviewer. A source-check date is not a human-reviewed date. Unresolved documentation conflicts remain flagged; no historical marks were changed."
          : "Human reviewer and approval date are recorded with each section. Approval accepts the notes and their caveats; unresolved vendor-documentation conflicts remain flagged. Historical marks remain unchanged."}
      </p>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold underline">Browse the 22-section source-review register</summary>
        <nav aria-label="Source-review register" className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {SLIDES.map((s) => (
            <a key={s.id} href={`#review-${s.id}`} className="rounded-lg border border-[#11110D]/15 bg-white px-3 py-2 underline">
              {s.n}. {s.short}
            </a>
          ))}
        </nav>
      </details>
    </aside>
  );
}

export function SectionSourceReview({ id }: { id: SlideId }) {
  const review = SECTION_REVIEWS[id];
  const human = review.humanReview;
  return (
    <aside id={`review-${id}`} aria-label={`Current source review: ${SLIDES.find((s) => s.id === id)!.short}`} className="hiw-review mt-5" data-testid={`source-review-${id}`}>
      <p className="text-xs font-bold uppercase tracking-wide">Current documentation · separate from the {SOURCE_ERA} deck</p>
      <p className="mt-2 text-sm leading-relaxed"><strong>Difference / qualification:</strong> {review.difference}</p>
      <p className="mt-2 text-xs leading-relaxed">
        Sources checked <time dateTime={review.sourcesCheckedOn}>{review.sourcesCheckedOn}</time>
        {" · "}{human.status === "approved"
          ? <>Human reviewed by {human.reviewer} on <time dateTime={human.reviewedOn}>{human.reviewedOn}</time></>
          : <>Human review pending · no human-reviewed date recorded</>}
      </p>
      <details className="mt-3" data-testid={`review-details-${id}`}>
        <summary className="cursor-pointer text-sm font-semibold underline">
          Capability evidence and review notes ({review.capabilities.length})
        </summary>
        <ul className="mt-3 grid gap-4">
          {review.capabilities.map((c) => (
            <li key={c.capability} className="border-t border-[#11110D]/15 pt-3">
              <h3 className="text-sm font-semibold">{c.capability}</h3>
              <p className="mt-1 text-xs font-semibold">{ASSESSMENT_LABELS[c.assessment]} · editorial assessment</p>
              <p className="mt-1 text-sm leading-relaxed">{c.note}</p>
              <ul className="mt-2 grid gap-1 text-xs">
                {c.sources.map((key) => {
                  const source = REVIEW_SOURCES[key];
                  return <li key={key}>
                    <Ext href={source.url} className="underline">{source.title}</Ext>
                    {" · checked "}<time dateTime={source.checkedOn}>{source.checkedOn}</time>
                  </li>;
                })}
              </ul>
            </li>
          ))}
        </ul>
      </details>
    </aside>
  );
}
