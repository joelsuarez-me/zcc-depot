export type AgendaFields = {
  company: string;
  description: string;
  currentState: string;
  conversation: string;
  problems: string;
  outcomes: string;
  logoPath: string | null;
};

export const EMPTY_AGENDA: AgendaFields = {
  company: "",
  description: "",
  currentState: "",
  conversation: "",
  problems: "",
  outcomes: "",
  logoPath: null,
};

export const MORNINGSTAR_AGENDA: AgendaFields = {
  company: "Morningstar",
  description: "Explore how Zendesk Contact Center may fit Morningstar’s priority customer service needs and identify what requires follow-up validation.",
  currentState: "Five9 for voice; LivePerson for digital engagement.",
  conversation: [
    "1. Align on priorities: Confirm Morningstar’s evaluation goals and the customer and agent journeys that matter most.",
    "2. Map the current environment: Review channels, routing, agent workflow, customer context, reporting, and key systems alongside Five9 and LivePerson.",
    "3. Walk through relevant Zendesk Contact Center experiences: Use agreed scenarios to explore how they map to Morningstar’s requirements.",
    "4. Discuss fit and next steps: Capture integration, coexistence or migration, security/compliance, and operating questions; agree on owners and follow-up.",
  ].join("\n"),
  problems: [
    "- Where, if anywhere, do agents move between tools during a customer interaction?",
    "- How do customer context, routing, and reporting work across voice and digital today?",
    "- Which integration, reliability, security/compliance, or change requirements shape the evaluation?",
  ].join("\n"),
  outcomes: [
    "- Prioritized use cases and evaluation criteria.",
    "- A clear view of Zendesk Contact Center fit against the requirements discussed.",
    "- Open technical and business questions, owners, and agreed next steps.",
  ].join("\n"),
  logoPath: null,
};

// Keep the original persisted fields so previously saved agendas remain intact.
export const AGENDA_SECTIONS = [
  {
    key: "currentState", label: "Current platforms",
    prompt: "Capture the current voice and digital platforms.",
    placeholder: "Five9 for voice; LivePerson for digital engagement.",
    noteLabel: "Current platforms", rows: 3,
  },
  {
    key: "conversation", label: "Today’s conversation",
    prompt: "Plan the discussion in order.",
    placeholder: "1. Align on priorities: Confirm evaluation goals and key journeys.\n2. Map the current environment: Review channels, workflows, and systems.",
    noteLabel: "Conversation steps · one item per line", rows: 9,
  },
  {
    key: "problems", label: "Questions to validate",
    prompt: "Identify what needs discovery or follow-up.",
    placeholder: "- Where do agents move between tools?\n- What technical and operating requirements shape the evaluation?",
    noteLabel: "Questions · one item per line", rows: 5,
  },
  {
    key: "outcomes", label: "Desired outcomes",
    prompt: "Define what the conversation should achieve.",
    placeholder: "- Prioritized use cases and evaluation criteria.\n- Open questions, owners, and agreed next steps.",
    noteLabel: "Outcomes · one item per line", rows: 5,
  },
] as const;
