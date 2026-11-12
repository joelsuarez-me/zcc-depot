// Internal source content stays server-side; never import this into a web bundle.
export const SELL_SHEET_PDF_PATH = "/objects/uploads/3a18e0b1-616c-4738-8eed-b49adc3c3029";

const discoveryQuestions = [
  "Do customers contact you by phone today? Do you advertise a toll-free number?",
  "What call volumes do you handle monthly, and how does this fluctuate?",
  "Roughly how important is voice compared to your other channels?",
  "How is your contact center organization structured across locations?",
  "What tools are you using today for voice/contact center?",
  "What is the biggest thing you wish voice support did better: speed, routing, reporting, consistency, cost, or customer frustration?",
  "How consistent are call notes across agents/teams? What breaks when notes are incomplete?",
  "Do agents put customers on hold to search policy/procedure, or move between systems to find answers?",
  "When a case escalates, does the next team get a clean summary/context, or do customers repeat everything?",
  "Are there requirements around call recording, redaction, retention, or data residency?",
];

export const sellSheet = {
  title: "Zendesk Contact Center Sales Guide",
  businessChallenge: "Contact centers moved from on-premise to cloud platforms, and now the next big shift is AI. When voice and digital support live in separate systems, leaders struggle to improve performance without adding complexity. They are under pressure to simplify, drive real-time efficiency, and implement AI across the service journey.",
  pains: [
    "Reliability issues: outages, dropped calls, poor integrations, and no failover.",
    "Outdated, complex legacy platforms: specialized IT administration and slow innovation.",
    "Fragmented agent experience: multiple tools reduce productivity and morale.",
    "Slow resolutions and manual workflows caused by data silos.",
  ],
  pitch: [
    "Zendesk Contact Center is an enterprise-grade voice solution that brings scalable contact center capabilities into the Zendesk experience, helping teams unify voice and digital support.",
    "Designed for organizations where voice is a major channel: reliability, flexibility, and smarter call handling without forcing agents to jump across disconnected systems.",
    "One vendor to streamline and save: a unified platform with less middleware complexity.",
    "AI-powered interaction orchestration: AI built in, not bolted on.",
    "Quick time to value and faster ROI: a path to modern agentic CX.",
    "High-quality customer service: optimize for resolutions with precision.",
  ],
  plays: [
    {
      title: "Modernizing legacy and fragmented tech stacks",
      help: "Bring scalable contact center capabilities into Zendesk for high-volume voice organizations, supporting voice and digital channels with more reliability, flexibility, and smarter call handling.",
      capabilities: [
        "Conversational IVR helps customers reach the right support and can handle simple tasks without an agent.",
        "Unified Agent Workspace keeps voice and customer context together, helping agents focus on service instead of finding information.",
        "Native Contact Center management with low/no-code tools supports shared context, reporting, and ongoing improvement.",
      ],
      metrics: [
        "Source reports 50%+ reduction in after-work time compared with traditional voice channels by moving to a unified platform.",
        "Source reports less than 5 minutes of after-call work (ACW).",
      ],
      stories: ["TELUS", "SupportZebra"],
    },
    {
      title: "Deploying AI and automation thoughtfully",
      help: "AI is not just about replacing people: it also helps humans handle complex calls, resolve them more consistently, and reduce administrative work after a call.",
      capabilities: [
        "Real-time Voice Copilot: transcription captures what is said, knowledge suggestions surface relevant help, and summaries support faster, more consistent wrap-up.",
        "AI-powered Auto Assist helps complete after-call work for every interaction.",
        "Voice AI Agents understand intent and act autonomously using customer context and knowledge.",
      ],
      metrics: [
        "Source cites SupportZebra combining AI automation and human support for a specific client: 29% reduction in average handle time (AHT) and 18% increase in average order value.",
      ],
      stories: ["SupportZebra"],
    },
    {
      title: "Balancing cost and scale",
      help: "Combine native AWS reliability with a Zendesk platform focused on quality resolutions, consolidating technology, optimizing staffing, and improving operational efficiency.",
      capabilities: [
        "Unified AI-native analytics with generative AI helps uncover root causes and report on natural-language questions, supporting real-time intervention and historical trends.",
        "Cloud-native architecture supports fluctuating demand.",
        "AWS security and scale provide a global cloud-native system with built-in resilience.",
      ],
      metrics: [
        "Source reports 30–50% AHT reduction and improved BPO scalability.",
        "Source reports a five-week implementation.",
      ],
      stories: ["SupportZebra", "The Good Meal Co"],
    },
  ],
  preparation: [
    {
      title: "New business",
      steps: [
        "Review the account website and note its support channels.",
        "Use builtwith.com to identify the existing CX vendor.",
        "For greenfield accounts, uncover gaps such as no help center, chat, or path to an agent. If a CX vendor is present, review Seismic competitive resources for that vendor.",
        "Identify where Contact Center can help. Use this customer-specific hook to personalize outreach.",
      ],
      questions: discoveryQuestions,
    },
    {
      title: "Existing Zendesk accounts",
      steps: [
        "Look up account usage in the CS Dashboard to understand how Zendesk is used today.",
        "Use Monitor to research integrated competitor products, such as NICE or Five9.",
        "Align with the CS representative, if available, on the current voice process and key pain points. Identify the Contact Center opportunity and personalize outreach.",
      ],
      questions: discoveryQuestions,
    },
    {
      title: "Cross-sell",
      steps: [
        "Use the same account-research and discovery approach.",
        "If the existing Contact Center tool is known, research it ahead of time and check Seismic battle cards.",
      ],
      questions: [
        ...discoveryQuestions,
        "How long have you used your current Contact Center tool, and why was it selected?",
        "What challenges or limitations have you encountered?",
        "How well does the current tool integrate with Zendesk?",
        "What does success look like: fewer vendors, fewer renewals, or simpler ownership?",
        "What happens when a customer needs to escalate from digital to voice?",
      ],
    },
  ],
  pdfUrl: "/api/sell-sheet/pdf",
};
