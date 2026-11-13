// SERVER-ONLY DATA. Restricted Depot content moved out of the public client bundle.
// Served exclusively through the protected presenter content endpoint.
// Do not import this module from any frontend package.

export type DepotRoadmapItem = { when: string; t: string; d: string; items: string[] };
export type DepotGtmSection = { t: string; body: string; list: string[] };
export type DepotPrivateResource = { id: string; title: string; url: string; category: string; kind: string };

const GTM_DOC_URL = "https://docs.google.com/document/d/1Cpv8Sg_BQ_R6kK6uBK91NOJGw3s0mVL7cN0uQ4PbiTA/edit?tab=t.0#heading=h.2rzpayujd9if";

export const depotPrivateContent: {
  roadmap: { executive: DepotRoadmapItem[]; technical: DepotRoadmapItem[]; internal: DepotRoadmapItem[] };
  gtm: DepotGtmSection[];
  briefing: string[];
  resources: DepotPrivateResource[];
} = {
  roadmap: {
  executive: [
    { when: "Q2 2026", t: "Fully native Contact Center", d: "Build the foundation for power, data, and faster innovation across the Resolution Platform.", items: ["Unified workspace", "Multimodal video", "Zendesk AI agents", "Zendesk knowledge"] },
    { when: "Q3 2026", t: "Agentic Contact Center", d: "Use service data to orchestrate self-service, routing, and tasks across systems.", items: ["Voice AI agents", "Copilot Auto Assist", "Admin Copilot actions", "Expanded knowledge"] },
    { when: "Q4 2026", t: "Enriched data and insights", d: "Unify call events to support real-time insights, predictive forecasting, and custom call scoring.", items: ["Integrated OCR", "Task agents", "Intelligent AI routing", "Unified WEM"] },
    { when: "EOY", t: "Self-improving service", d: "Envision a business analyst that identifies trends and recommends actions through custom reports and conversational BI.", items: ["Analyst Copilot", "Conversational BI", "Real-time QA", "AI agent QA"] },
  ],
  technical: [
    { when: "Q2 2026", t: "Workspace foundation", d: "", items: ["Unified Agent Workspace MVP: embed call capabilities in the agent workspace", "Unified Call Object: manage voice interactions natively within Zendesk", "Voice Copilot knowledge suggestions: surface relevant knowledge during calls (deck labels this LIVE)", "Voice AI Agents (deck labels these EAP LIVE)"] },
    { when: "Q3 2026", t: "Multimodal and agent support", d: "", items: ["Video calling and screen sharing initiated by agents", "Voice Copilot Auto Assist with post-call instructions for faster wrap-up", "Unified Dashboards with real-time and historical reporting"] },
    { when: "Q4 2026", t: "Advanced operations and AI", d: "", items: ["Advanced Multimodal with AI transcription, workflow automation, and customer-initiated video", "Real-time QA and Voice AI Agent Reporting", "Unified Omnichannel Routing (OCR) between Zendesk and Amazon Connect", "Unified WFM and Analyst Copilot"] },
  ],
  internal: [
    { when: "Aug\u2013Oct FY2027", t: "Native Contact Center parity", d: "", items: ["VDI optimization, quick connects, outbound queue selection, custom call attributes, and multi-tab support", "Agent-initiated browser video and real-time screen sharing; native voicemail configuration", "Copilot template instructions and Contact Center Voice AI agents", "Real-time voice translations (EAP) and unified real-time QA"] },
    { when: "Nov\u2013Jan FY2027", t: "Enterprise Contact Center", d: "", items: ["Multiple Amazon Connect instances, ACGR, Amazon Connect chat, and integrated team management", "Contact Center CX Agents and Copilot Auto Assist", "Analyst Copilot for self-service NQL dashboards through HyperArc", "Unified WFM and dashboards, plus department and brand support"] },
    { when: "Feb\u2013Jul FY2028", t: "Enterprise voice controls", d: "", items: ["Interrupt routing, agent-to-agent calling, and agent call-recording permissions", "Integrated omnichannel routing, video call recording, and an AI-configured Contact Center", "Contact Center Call Object for complex conversations and human handoff", "Voice AI Agents Phase 2, advanced multimodal support, and real-time translation GA", "Outcome-based pricing migration and preview-dialing outbound campaigns"] },
  ],
  },
  gtm: [
  { t: "Market context and customer pain", body: "The guide frames the category shift as on-premise telephony moving to cloud contact centers, then toward AI-first service. Buyers want voice to work as part of the overall service experience, with less tool sprawl and less friction for customers and agents.", list: ["Legacy stacks separate voice, ticketing, CRM, knowledge, and reporting.", "Customers repeat information, get transferred, and wait while agents search for context.", "Agents swivel between tools; leaders face fragmented reporting and growing integration effort.", "Common buyer signals include consolidation pressure, demand for real-time AI value, agent experience concerns, and high expectations for voice reliability."] },
  { t: "Product story and role of Amazon Connect", body: "Describe Zendesk Contact Center as Zendesk's enterprise-grade voice solution for organizations where voice is important and requirements are more complex. Amazon Connect provides the cloud telephony foundation; Zendesk Contact Center connects that voice layer with Zendesk Agent Workspace and the broader service platform.", list: ["Simple positioning: \u201cZendesk Contact Center brings scalable voice capabilities into the Zendesk experience, helping teams support customers across voice and digital channels in a more unified way.\u201d"] },
  { t: "Core capabilities to recognize", body: "Use the relevant product and configuration details when describing availability; this overview is for first conversations, not technical scoping.", list: ["Conversational IVR: guides callers to the right next step and can handle simpler requests.", "Intelligent routing: routes calls based on customer need and agent fit, helping reduce avoidable handoffs.", "Queue and call handling: manages real-time demand, including callback patterns where configured.", "Agent Workspace: keeps voice work connected to tickets, customer context, and Zendesk workflows.", "AI support: live transcription, knowledge suggestions, and summaries can support agents during and after calls.", "After-call work: automation and AI assistance can reduce manual wrap-up effort and improve consistency.", "Reporting and quality: turns interactions into operational insights for service improvement."] },
  { t: "Buyer lenses and discovery questions", body: "Starter questions to open the conversation.", list: ["Customer experience leaders: broken handoffs, channel inconsistency, slow resolution, and AI trust concerns.", "Contact center operations: call volume, routing friction, high handle time, manual wrap-up, and agent capacity issues.", "IT leaders: vendor sprawl, integration complexity, legacy infrastructure, and reliability requirements.", "Executive and financial leaders: cost-to-serve, software spend, and scaling without adding headcount at the same rate.", "Do customers contact you by phone today, and when is voice most critical?", "How do agents handle a call when the customer started in self-service or chat?", "How much time do agents spend updating records and logging notes after calls?", "How many systems or vendors run voice and customer support today?", "How do complex calls reach the right expert without repeated handoffs?"] },
  { t: "Early qualification and specialist handoff", body: "Listen for the \u201cgravity\u201d of the voice channel: whether voice is a major channel, where escalations happen, whether an outage would be business-critical, and whether basic voice tools no longer fit. A strong handoff includes the customer's environment, current voice stack, urgency, target outcomes, and known scale or routing complexity.", list: ["Confirm voice is a real, relevant channel.", "Understand scale and operational complexity without relying only on seat count.", "Identify the current voice platform and buying context.", "Connect the customer's pain to measurable outcomes.", "Bring in Contact Center specialists when there is meaningful fit and a real project."] },
  { t: "Positioning and competitive conversations", body: "Lead with outcomes rather than a feature checklist: a more unified voice and digital experience, better agent context, fewer disconnected tools, and a platform that can improve service over time. When a competitor comes up, acknowledge it and ask what is driving change, then choose the relevant story instead of guessing.", list: ["Three-beat pitch: what it is (enterprise-grade voice in Zendesk), why it matters (voice remains critical and fragmented tools create friction), and why now (AI and consolidation make unified service more valuable)."] },
  { t: "Commercial model and expectation setting", body: "Pricing may include per-user licensing, minute blocks, and additional usage charges. Implementation is typically paid, and support expectations depend on the purchase path. Confirm current packaging, pricing, services, and support requirements with a Contact Center specialist before quoting.", list: ["Zendesk Contact Center bundle: Zendesk Contact Center and Amazon Connect together under a Zendesk contract.", "Contact Center License: a bring-your-own-Amazon path for customers with an AWS relationship or preference.", "Contact Center Team: a lighter-weight option for customers who do not need the full Suite path."] },
  { t: "Objection handling and key terms", body: "Acknowledge the concern, ask one clarifying question, reconnect the discussion to outcomes, and involve specialists when technical detail is needed.", list: ["FCR: First Contact Resolution, the share of issues resolved during the first interaction.", "AHT: Average Handle Time, including talk, hold, and wrap-up time.", "Deflection: resolving an inquiry through automation or self-service before it reaches a live agent.", "Skills-based routing: routing calls toward agents suited to the customer's topic or urgency.", "CCaaS: Contact Center as a Service, a cloud-delivered contact center platform."] },
  ],
  briefing: [
    "Latest news (per internal briefing): Agent-to-Agent collaboration in Amazon Connect.",
    "Per the source briefing, AWS launched A2A collaboration (GA, Customer tier), bringing specialist AI agents into live customer contacts under a Connect orchestrator.",
    "Terminology: A2A here means AI-agent collaboration, not a human agent-to-agent transfer. Connect adds voice streaming, session continuity, and built-in observability to the open A2A protocol.",
    "Flow 01, Live contact: Customer calls Amazon Connect.",
    "Flow 02, Connect AI orchestrator: Chooses whether and when to involve a specialist.",
    "Flow 03, Specialist collaborator: Connect, Bedrock AgentCore, or a compliant external agent.",
    "Flow 04, Resolution path: Return to orchestrator or escalate through the contact flow.",
    "Mode 01, Delegate behind the scenes: The orchestrator stays with the customer while a specialist handles a focused task, such as a fraud risk assessment, then returns a result.",
    "Mode 02, Hand off to a specialist: The collaborator speaks with the customer for a multi-turn task, then returns control with a completion or escalation outcome.",
    "What it means for Zendesk Contact Center: ZCC runs on Amazon Connect, so A2A could fit its voice foundation. Open design questions: account tier, API configuration ownership, context transfer, reporting, and commercial model.",
    "Availability: Confirm Connect Customer tier eligibility and regional rollout.",
    "Orchestration: Decide which agent leads and whether Zendesk AI or Forethought should be explored as a collaborator.",
    "Context + controls: Design ticket-data access, trace reporting, human escalation, and combined AI-cost visibility.",
    "Based on an internal A2A briefing; dates and tiers as stated there. Zendesk AI and Forethought collaborator paths require product and technical validation and are not presented as current integrations."
],
  resources: [
    { id: "gtm", title: "Contact Center Level 1 Foundation GTM guide (internal, access required)", url: GTM_DOC_URL, category: "Platform & product", kind: "Internal" },
  ],
};
