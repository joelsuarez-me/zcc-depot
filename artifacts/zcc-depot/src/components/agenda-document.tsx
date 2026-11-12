import { motion, useReducedMotion } from "framer-motion";
import type { AgendaFields } from "@/data/agenda-template";
import { SectionLink } from "@/components/section-link";

const MARKER = /^\s*(?:\d+[.)]|[-*•–])\s+/;

/** Split text into non-empty lines with leading list markers removed. */
export function parseAgendaLines(text: string): string[] {
  return (text ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(MARKER, "").trim())
    .filter(Boolean);
}

/** Split a step into a leading label (before the first colon) and body. */
export function splitLeadLabel(line: string): { label: string | null; body: string } {
  const index = line.indexOf(":");
  if (index > 0 && index <= 80) {
    return { label: line.slice(0, index).trim(), body: line.slice(index + 1).trim() };
  }
  return { label: null, body: line };
}

function Paragraphs({ text, testId }: { text: string; testId: string }) {
  const blocks = (text ?? "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-3" data-testid={testId}>
      {blocks.map((block, i) => (
        <p key={i} className="whitespace-pre-line text-[1.05rem] leading-relaxed text-[#2c3a31] md:text-lg">{block}</p>
      ))}
    </div>
  );
}

function Section({ title, children, delay }: { index: number; title: string; children: React.ReactNode; delay: number }) {
  const reduced = useReducedMotion();
  const id = `agenda-${title.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <motion.section
      id={id}
      data-section-nav
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: reduced ? 0 : delay, ease: [0.2, 0.7, 0.2, 1] }}
      className="grid gap-3 border-t border-[#dfe2d8] py-7 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-10 md:py-9"
    >
      <h3 className="flex items-baseline gap-3 text-[#244b39]">
        <span className="text-lg font-semibold tracking-tight">{title}</span><SectionLink id={id} label={title} />
      </h3>
      <div className="min-w-0">{children}</div>
    </motion.section>
  );
}

function Empty() {
  return <p className="text-sm italic text-[#8a948b]">Not provided.</p>;
}

export function AgendaDocument({ fields, logoUrl }: { fields: AgendaFields; logoUrl: string }) {
  const reduced = useReducedMotion();
  const company = fields.company.trim();
  const steps = parseAgendaLines(fields.conversation);
  const questions = parseAgendaLines(fields.problems);
  const outcomes = parseAgendaLines(fields.outcomes);

  const bullets = (items: string[], testId: string) =>
    items.length ? (
      <ul className="space-y-3" data-testid={testId}>
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-[1.02rem] leading-relaxed text-[#2c3a31]">
            <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#244b39] ring-4 ring-[#D1F470]/60" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ) : <Empty />;

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-[#d9ddd2] bg-[#fbfbf6] shadow-[0_24px_60px_-40px_rgba(30,53,40,.45)]" data-testid="document-agenda">
      <motion.header
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
        className="relative bg-[#244b39] px-6 py-5 text-[#f6f5ec] md:px-8 md:py-6"
      >
        <div className="grid-lines absolute inset-0 opacity-50" aria-hidden />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="eyebrow text-[#d4e4a6]">Customer conversation agenda</div>
            <h2 className="mt-2 break-words text-2xl font-semibold leading-tight tracking-tight md:text-3xl" data-testid="text-document-title">
              {company || "Customer"} <span className="text-[#D1F470]">|</span> Zendesk Contact Center Demo
            </h2>
          </div>
          {logoUrl && (
            <div className="flex h-20 w-full max-w-[12rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-3 shadow-sm md:w-48">
              <img src={logoUrl} alt={`${company || "Customer"} logo`} className="block h-full w-full min-h-0 min-w-0 object-contain" data-testid="img-document-logo" />
            </div>
          )}
        </div>
      </motion.header>

      <div className="px-6 pb-4 md:px-12">
        <Section index={1} title="Objective" delay={0.08}>
          {fields.description.trim() ? <Paragraphs text={fields.description} testId="text-document-objective" /> : <Empty />}
        </Section>
        <Section index={2} title="Current platforms" delay={0.14}>
          {fields.currentState.trim() ? <Paragraphs text={fields.currentState} testId="text-document-current" /> : <Empty />}
        </Section>
        <Section index={3} title="Today’s conversation" delay={0.2}>
          {steps.length ? (
            <ol className="space-y-4" data-testid="list-document-conversation">
              {steps.map((step, i) => {
                const { label, body } = splitLeadLabel(step);
                return (
                  <li key={i} className="flex gap-4">
                    <span className="mono grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#D1F470] text-xs font-medium text-[#203524]">{i + 1}</span>
                    <p className="pt-1 text-[1.02rem] leading-relaxed text-[#2c3a31]">
                      {label && <strong className="font-semibold text-[#1e3528]">{label}:</strong>} {body}
                    </p>
                  </li>
                );
              })}
            </ol>
          ) : <Empty />}
        </Section>
        <Section index={4} title="Questions to validate" delay={0.26}>{bullets(questions, "list-document-questions")}</Section>
        <Section index={5} title="Desired outcomes" delay={0.32}>{bullets(outcomes, "list-document-outcomes")}</Section>
      </div>
    </article>
  );
}

export default AgendaDocument;
