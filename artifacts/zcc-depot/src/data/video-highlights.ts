export const WALKTHROUGH_URL = "https://www.youtube.com/watch?v=_fYZpydDbXM";

export const VIDEO_HIGHLIGHTS = [
  {
    start: 293, time: "04:53–07:14", title: "The cost of fragmented tools",
    highlight: "Connect the platform story to longer handling times, inconsistent answers, and agent frustration.",
    transcript: "The presenters describe agents moving between separate knowledge bases, tickets, customer records, and call history. They position a unified workspace as a way to bring that information together and reduce tool switching.",
  },
  {
    start: 440, time: "07:20–10:23", title: "Zendesk and the AWS voice stack",
    highlight: "Understand the roles of Amazon Connect, Lex, Lambda, data services, and Zendesk Agent Workspace.",
    transcript: "Amazon Connect provides telephony, routing, and queue management. Lex captures intent, while Lambda and data services support lookups and integrations. Zendesk Agent Workspace brings the interaction into the agent’s working environment. The presenters also discuss low-code options for smaller operational changes.",
  },
  {
    start: 635, time: "10:35–14:17", title: "Voice AI and human escalation",
    highlight: "Follow a login-support scenario from AI self-service to a specialist handoff.",
    transcript: "The bot looks up the incoming phone number, asks which product is affected, and gathers information about the login problem. When the caller describes an account lockout, it transfers the call to a specialist. The technical introduction references Lambda, Amazon Q, S3, and a knowledge base.",
  },
  {
    start: 862, time: "14:22–17:28", title: "Context in the agent workspace",
    highlight: "Show how the agent receives context instead of restarting the customer conversation.",
    transcript: "The workspace combines the ticket, previous interaction context, Contact Lens integration, and fields for intent, language, and sentiment. The agent can consult knowledge suggestions, customer history, related tickets, and side conversations without switching applications.",
  },
  {
    start: 1050, time: "17:30–18:56", title: "Faster after-call work",
    highlight: "Use prepared notes and resolution tagging to explain a less manual wrap-up workflow.",
    transcript: "After ending the call, the agent reviews and edits pre-populated information, applies resolution tags, and submits the ticket as solved. The presenters emphasize reducing copying and pasting between disconnected systems.",
  },
  {
    start: 1158, time: "19:18–22:08", title: "AI chat with human assistance",
    highlight: "Extend the journey to an embedded widget, knowledge-based answers, and agent-reviewed replies.",
    transcript: "A customer asks about dashboard access. The AI agent summarizes relevant knowledge and provides supporting articles before the interaction moves to a human. The agent reviews an AI-generated reply and can adjust its tone. Messaging, chat, and callback options are also discussed.",
  },
  {
    start: 1351, time: "22:31–29:31", title: "Three layers of operational insight",
    highlight: "Explore intelligent triage, real-time operations, and historical performance.",
    transcript: "The walkthrough covers intent, entities, sentiment, queue activity, handled calls, service levels, handling time, after-call work, transfers, abandonment, and resolution codes. It also discusses custom dashboards and scheduled report delivery. The presenters describe the demonstrated dashboards as out-of-the-box capabilities.",
  },
  {
    start: 1773, time: "29:33–33:50", title: "Discovery through ongoing support",
    highlight: "Frame delivery as requirements, design and build, QA, UAT, go-live, and support.",
    transcript: "The delivery approach begins with workshops to document user stories, call flows, and integrations. It proceeds through design, configuration, internal QA, and customer acceptance testing. The presenter gives two to five days as an example hypercare period, depending on requirements, followed by managed support and optimization.",
  },
] as const;
