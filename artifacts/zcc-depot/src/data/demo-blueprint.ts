import { DEMO_URL, LINKS, RESOURCES } from "./content.ts";

export const SESSION_LENGTHS = [30, 45, 60] as const;
export type SessionLength = (typeof SESSION_LENGTHS)[number];
export const DEFAULT_SESSION_LENGTH: SessionLength = 45;

export type BlueprintLink = { label: string; href: string };
export type BlueprintBeat = { label: string; description: string; weight: number };
export type BlueprintStage = {
  id: string;
  title: string;
  minutes: Record<SessionLength, number>;
  value: string;
  presenterCue: string;
  proof: string;
  transition: string;
  links: readonly BlueprintLink[];
  beats?: readonly BlueprintBeat[];
  productNotes?: readonly { label: string; description: string }[];
};

export const BLUEPRINT_DESCRIPTION = "One customer journey. From first contact to AI-assisted resolution, quality insights, and measurable business value.";
export const BLUEPRINT_TIMING_NOTE = "Times are elapsed from the session start. Transitions and closing questions are included.";
export const BLUEPRINT_DISCLAIMER = "Demonstrate capabilities enabled in your environment. Availability, licensing, and configuration vary; confirm current scope with Zendesk.";

const qaTranscription = RESOURCES.find(resource => resource.id === "qa-transcriptions");

export const BLUEPRINT_STAGES: readonly BlueprintStage[] = [
  {
    id: "outcomes",
    title: "Align on outcomes",
    minutes: { 30: 3, 45: 4, 60: 5 },
    value: "Establish what would make this demonstration relevant to the buyer.",
    presenterCue: "Ask which problems matter most: customers repeating information, lengthy handling and wrap-up, inconsistent service quality, or missed service levels. Agree on two success measures. Introduce one scenario: a customer cannot access an account before an urgent event.",
    proof: "The buyer’s problem, baseline, and desired result.",
    transition: "Let’s follow that customer from first contact to resolution.",
    links: [{ label: "Platform overview", href: "/#platform" }],
  },
  {
    id: "entry",
    title: "Customer entry & handoff",
    minutes: { 30: 4, 45: 6, 60: 8 },
    value: "Connect the customer to the right resolution path with useful context.",
    presenterCue: "Show the configured entry flow, capture intent, and escalate the same issue to a human. Identify the AI provider and distinguish working functionality from a simulation. Caller recognition is not authentication.",
    proof: "The receiving agent sees the intent and configured context.",
    transition: "What does the agent know before asking the customer to repeat anything?",
    links: [{ label: "Customer journey", href: "/#how-it-works" }],
  },
  {
    id: "workspace",
    title: "Agent workspace & context",
    minutes: { 30: 7, 45: 10, 60: 14 },
    value: "Help the agent handle the interaction with customer and call context together.",
    presenterCue: "Accept the call and show the ticket, customer history, and mapped call details. If enabled, introduce the incoming-call or ticket summary and explain its source. Demonstrate one relevant call-control action. Keep the same customer and issue throughout.",
    proof: "The agent handles the call within the workspace using useful context.",
    transition: "Now let’s help the agent find the right answer while the conversation continues.",
    links: [{ label: "Agent experience", href: "/#how-it-works" }],
  },
  {
    id: "copilot",
    title: "Voice Copilot & wrap-up",
    minutes: { 30: 5, 45: 7, 60: 9 },
    value: "Help the agent resolve the issue and complete after-call work with AI assistance.",
    presenterCue: "Open the enabled live transcript after speech begins. Request a knowledge suggestion and review its supporting content. Resolve the issue, review the configured summary and classification, complete required ticket fields, and finish wrap-up. Show the agent checking AI output.",
    proof: "A grounded answer and a completed ticket, with less manual searching and documentation demonstrated in the workflow.",
    transition: "We’ve helped the agent resolve this interaction. Now let’s show how a supervisor evaluates its quality and turns that insight into better service.",
    links: [
      { label: "Agent knowledge", href: "/resources#ai-suggestions" },
      { label: "Real-time AI suggestions guide", href: LINKS.aiSuggestions },
    ],
    beats: [
      { label: "During-call Copilot", description: "During-call assistance: Live transcript, requested knowledge suggestion, and agent review.", weight: 3 },
      { label: "After-call Copilot and wrap-up", description: "After-call assistance: Review configured summarization and classification, complete required fields, and finish wrap-up.", weight: 4 },
    ],
  },
  {
    id: "quality",
    title: "Voice QA & operational control",
    minutes: { 30: 4, 45: 6, 60: 8 },
    value: "Help supervisors identify quality issues, coach agents, and respond to service risks.",
    presenterCue: "Open a prepared, previously completed call. Show the available recording, transcript, conversation analytics, and configured evaluation evidence. Identify one concrete quality issue and explain the coaching action. Then show an enabled operational view or a prepared supervisor-monitoring example. Do not depend on the current demo call’s post-call processing finishing immediately; clearly label any prepared example.",
    proof: "A supervisor can inspect the evidence, identify a quality or service risk, and take a practical action.",
    transition: "Here are the components supporting the agent experience, quality insights, and supervisor workflow.",
    productNotes: [
      { label: "Voice QA & conversation analytics — powered by Contact Lens", description: "The Amazon Connect / Contact Lens quality and analytics portion. Show recording, transcripts, evaluation evidence and analytics only where configured and available." },
      { label: "Zendesk QA — optional, separately configured", description: "A distinct capability, not the same product as Contact Lens. Configuration and licensing considerations are separate. Zendesk QA does not require Contact Lens for post-call transcription." },
    ],
    beats: [
      { label: "Voice QA and conversation analytics", description: "Quality review: Inspect a clearly labeled prepared call and available quality evidence.", weight: 1 },
      { label: "Coaching and operational control", description: "Supervisor action: Explain coaching, review queue visibility, or show a prepared monitoring/intervention example.", weight: 1 },
    ],
    links: [
      { label: "About AWS services in Contact Center", href: LINKS.awsServices },
      { label: "Contact Center dashboards guide", href: LINKS.dashboardsGuide },
      ...(qaTranscription ? [{ label: "Zendesk QA call transcriptions (optional)", href: qaTranscription.url }] : []),
    ],
  },
  {
    id: "architecture",
    title: "Architecture & confidence",
    minutes: { 30: 2, 45: 4, 60: 6 },
    value: "Give the buyer confidence in the implementation and ownership model.",
    presenterCue: "Trace one interaction through Amazon Connect routing, the configured integration, Zendesk Agent Workspace, and configured call-data writeback. Explain the role of Contact Lens in the demonstrated analytics/transcription workflow. If Zendesk QA is included, identify it as a separate integration. Confirm the account model, implementation owner, and one key dependency. Reserve deeper technical discussion for follow-up.",
    proof: "Clear routing ownership, product responsibilities, and implementation boundaries.",
    transition: "Let’s connect the workflow we saw to the outcomes you chose.",
    links: [{ label: "System + data flow", href: "/architecture#data-flow" }],
  },
  {
    id: "value",
    title: "Business value & next step",
    minutes: { 30: 5, 45: 8, 60: 10 },
    value: "Turn demonstrated capabilities into a measurable validation plan.",
    presenterCue: "Recap the buyer’s two success measures. Connect Voice Copilot to handling and wrap-up efficiency, and Voice QA to quality, consistency, and coaching effectiveness. Estimate value using buyer-provided inputs; confirm costs separately. Agree on a pilot owner, target date, and acceptance criteria. Offer Storylane as follow-up instead of restarting the product tour.",
    proof: "An agreed validation plan with an owner, target date, and measurable success criteria.",
    transition: "Which team and real use case should we validate first?",
    beats: [
      { label: "Business value", description: "Connect the demonstrated workflow to the buyer’s success measures and inputs.", weight: 3 },
      { label: "Questions", description: "Capture open questions and identify follow-up owners.", weight: 3 },
      { label: "Pilot commitment", description: "Agree on a pilot owner, target date, and measurable acceptance criteria.", weight: 2 },
    ],
    links: [
      { label: "Customer use cases", href: "/sales#use-cases" },
      { label: "Storylane follow-up", href: DEMO_URL },
    ],
  },
];

export type TimedBeat = BlueprintBeat & { startSeconds: number; endSeconds: number; durationSeconds: number };
export type TimedStage = BlueprintStage & {
  number: number;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  timedBeats: readonly TimedBeat[];
};

/** Elapsed session time, not a live clock. */
export function formatBlueprintTime(seconds: number): string {
  const whole = Math.round(seconds);
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}

export function buildBlueprintTimeline(sessionLength: SessionLength, stages: readonly BlueprintStage[] = BLUEPRINT_STAGES): readonly TimedStage[] {
  if (!SESSION_LENGTHS.includes(sessionLength)) throw new RangeError("Unsupported session length");
  let cursor = 0;
  return stages.map((stage, index) => {
    const startSeconds = cursor;
    const durationSeconds = stage.minutes[sessionLength] * 60;
    const endSeconds = startSeconds + durationSeconds;
    cursor = endSeconds;
    const beats = stage.beats ?? [];
    const totalWeight = beats.reduce((total, beat) => total + beat.weight, 0);
    let beatCursor = startSeconds;
    const timedBeats = beats.map((beat, beatIndex): TimedBeat => {
      const beatStart = beatCursor;
      // Round each non-final beat, then give all remaining seconds to the final beat.
      const beatEnd = beatIndex === beats.length - 1
        ? endSeconds
        : beatStart + Math.round(durationSeconds * beat.weight / totalWeight);
      beatCursor = beatEnd;
      return { ...beat, startSeconds: beatStart, endSeconds: beatEnd, durationSeconds: beatEnd - beatStart };
    });
    return { ...stage, number: index + 1, startSeconds, endSeconds, durationSeconds, timedBeats };
  });
}
