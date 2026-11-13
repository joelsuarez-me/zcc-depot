import { DEMO_URL, FAQ, FEATURES, RESOURCES, USE_CASES } from "@/data/content";
import { VIDEO_HIGHLIGHTS, WALKTHROUGH_URL } from "@/data/video-highlights";
import { BLUEPRINT_DESCRIPTION } from "@/data/demo-blueprint";
import { ROOMS } from "@/data/depot-rooms";

export type SearchGroup = "Pages" | "Sections" | "Features" | "Use cases" | "FAQ" | "Video highlights" | "Resources";
export type SearchEntry = { id: string; group: SearchGroup; title: string; description: string; keywords?: string; href: string; external?: boolean };

const page = (id: string, title: string, href: string, description: string, keywords = ""): SearchEntry => ({ id: `page-${id}`, group: "Pages", title, href, description, keywords });
const sec = (id: string, title: string, href: string, description: string, keywords = ""): SearchEntry => ({ id: `section-${id}`, group: "Sections", title, href, description, keywords });

const PAGES: SearchEntry[] = [
  page("home", "Overview", "/", "Zendesk Contact Center platform story, how it works, and features.", "home start platform"),
  page("demos", "Demos", "/demos", "Demo Blueprint, click-through, video highlights, and pre-demo spotlight.", "demo approach storyline stages"),
  page("demo-nuggets", "Demo Nuggets", "/demos/nuggets", "Play Voice Copilot, Voice QA, Voice AI Agents, and video calling and screen sharing simulations with optional ElevenLabs narration.", "animated capabilities play pause replay nuggets voice copilot quality assurance agents video screen share narration"),
  page("instance", "Demo Instance Details", "/demos/instance-details", "Details for the shared demo instance.", "environment sandbox login setup"),
  page("demo-brief", "Demo Researcher", "/demos/brief", "Research a company using current public sources and download a cited demo-preparation report as a PDF. Sign-in required.", "company research logo website region audience role demo brief PDF report"),
  page("pitch-deck", "Pitch Deck", "/resources#pitch-deck", "View and download the uploaded product deep-dive slides. Sign-in required.", "pitch deck presentation product deep dive slides resources"),
  page("architecture", "Architecture", "/architecture", "Amazon Connect, Lambda, system data flow, and core components.", "aws technical"),
  page("contact-center-components", "Understanding Contact Center components", "/architecture/components", "Interactive component map, customer AWS data boundary and corporate-to-Zendesk SAML sign-in sequence.", "Amazon Connect Cognito AWS SSO SAML identity IdP MFA Okta Entra Google Workspace privacy"),
  page("sales", "Sales", "/sales", "Use cases, customer examples and go-to-market guidance.", "gtm business value"),
  page("sell-sheet", "Sell Sheet", "/sell-sheet", "Signed-in access to the internal Zendesk Contact Center sales guide.", "sales guide enablement internal"),
  page("pricing", "Pricing", "/pricing", "Signed-in pricing and packaging guidance for the three Contact Center buying paths.", "commercial contract Amazon AWS sign in"),
  page("resources", "Resources", "/resources", "Official documentation, agent knowledge, news, pitch deck, FAQ and the confidential roadmap.", "docs documentation help center"),
  page("agenda", "Demo Agenda", "/agenda", "Signed-in area for preparing and presenting customer agendas.", "today’s agenda sign in presentation meeting"),
];

const SECTIONS: SearchEntry[] = [
  sec("pricing-bundle", "Zendesk Contact Center — the bundle", "/pricing#bundle", "The primary motion: Zendesk sells Contact Center and Amazon Connect together on one contract.", "pricing bundle purchasing"),
  sec("pricing-byoa", "Contact Center License — BYOA", "/pricing#byoa", "Bring-your-own-Amazon for customers with an AWS relationship or buying directly from Amazon.", "pricing license AWS Amazon contract"),
  sec("pricing-team", "Contact Center Team — the lighter-weight path", "/pricing#team", "For greenfield and net-new customers who do not want the full Suite.", "pricing team new customer"),
  sec("platform", "One solution", "/#platform", "Pillars of the unified contact center platform.", "pillars overview"),
  sec("how-it-works", "How it works", "/#how-it-works", "Call journey from customer to Agent Workspace.", "journey voice"),
  sec("features", "Features", "/#features", "Voice AI agents, copilots, translation, WEM, compliance.", "capabilities"),
  sec("demo-agenda", "Demo Blueprint", "/demos#agenda", BLUEPRINT_DESCRIPTION, "demo approach stages storyline methodology blueprint 30 45 60 minutes copilot QA"),
  sec("demo-click-through", "Demo Click-Through", "/demos#guided-demo", "Play the embedded Zendesk Contact Center walkthrough.", "storylane interactive guided demo"),
  sec("nugget-copilot", "Voice Copilot simulation", "/demos/nuggets#voice-copilot", "Simulate a returns call, recognized intent and in-call knowledge guidance.", "demo nuggets refund transcript returns neutral sentiment quick answer"),
  sec("nugget-library", "Demo Nuggets library", "/demos/nuggets#library", "Browse Voice Copilot, Voice QA, Voice AI Agents, and video calling and screen sharing demos.", "feature simulations library"),
  sec("nugget-voice-qa", "Voice QA simulation", "/demos/nuggets#voice-qa", "Illustrate a quality review with churn-risk, product-issue and exceptional-service spotlights.", "demo nuggets quality assurance spotlight call recording review"),
  sec("nugget-voice-ai", "Voice AI Agents simulation", "/demos/nuggets#voice-ai-agents", "Simulate a replacement conversation with staged pickup and notification actions.", "demo nuggets customer confirmation automation animated voice agent"),
  sec("nugget-video", "Video calling & screen sharing simulation", "/demos/nuggets#video-screen-sharing", "Invite a customer to video, preview audio and camera, and share a prepared setup window while retaining ticket context.", "demo nuggets video call window sharing customer agent ElevenLabs narration"),
  sec("video-highlights", "Video highlights", "/demos#video-highlights", "Timestamped walkthrough chapters.", "youtube walkthrough"),
  sec("video", "Video calling & screen sharing", "/demos#video", "Visual channels for complex support conversations.", "video call screen sharing"),
  sec("spotlight", "Pre-demo spotlight", "/demos#spotlight", "What to prepare before the demo.", "prep"),
  sec("journey", "Call journey", "/#how-it-works", "From Amazon Connect to the Zendesk agent experience.", "flow"),
  sec("ai-suggestions", "Agent knowledge · Real-time AI suggestions", "/resources#ai-suggestions", "Transcription and knowledge suggestions during calls.", "copilot"),
  sec("data-flow", "Architecture & data flow", "/architecture#data-flow", "Agent controls, customer context, and call records flows.", "lambda api gateway cognito ctr"),
  sec("components", "Core components", "/architecture#components", "Amazon Connect, app, identity, CloudFormation.", "cognito saml lambdas"),
  sec("component-connect", "Amazon Connect · Architecture panel", "/architecture#component-connect", "Core component panel: telephony, contact routing, and the customer's AWS Connect instance.", "voice chat queues contact flows routing"),
  sec("component-app", "Contact Center app · Architecture panel", "/architecture#component-app", "Core component panel: the Zendesk-built agent interface for calls, messages, and dashboards.", "agent interface omnichannel AI tools supervisor dashboard call controls"),
  sec("component-identity", "Identity and sign-in · Architecture panel", "/architecture#component-identity", "Core component panel: Cognito user accounts, Zendesk SAML sign-in, and the corporate identity provider.", "Cognito user pool SAML 2.0 SSO corporate MFA policies IdP Okta Entra Google Workspace"),
  sec("component-cloudformation", "CloudFormation · Architecture panel", "/architecture#component-cloudformation", "Core component panel: automated AWS resource deployment, permissions, and stack lifecycle.", "automated setup AWS permissions stack lifecycle IAM roles Lambda functions streaming connections infrastructure template"),
  sec("use-cases", "Use cases", "/sales#use-cases", "Customer scenarios and outcomes.", "scenarios value"),
  sec("outcomes", "Customer outcomes", "/sales#outcomes", "Proof points from customers.", "stats TELUS SupportZebra Good Meal"),
  sec("faq", "FAQ", "/resources#faq", "Common customer questions.", "questions"),
  sec("library", "Resource library", "/resources#library", "Browse and filter the official documentation collection.", "documentation articles"),
];

export const SEARCH_INDEX: SearchEntry[] = [
  ...ROOMS.map((r) => page(`room-${r.id}`, `Room ${r.n} · ${r.title}`, r.href, r.summary, `room ${r.audience}`)),
  ...ROOMS.flatMap((r) => r.sections.map((x) => sec(`room-${r.id}-${x.id}`, `${x.label} · ${r.title}`, `${r.href}#${x.id}`, r.summary, "room"))),
  ...PAGES,
  ...SECTIONS,
  ...FEATURES.map((f, i) => ({ id: `feature-${i}`, group: "Features" as const, title: f.t, description: f.d, keywords: f.tag, href: "/#features" })),
  ...USE_CASES.map((u, i) => ({ id: `usecase-${i}`, group: "Use cases" as const, title: u.t, description: u.scenario, keywords: [...u.outcome, ...u.enables].join(" "), href: "/sales#use-cases" })),
  ...FAQ.map(([q, a], i) => ({ id: `faq-${i}`, group: "FAQ" as const, title: q, description: a, href: "/resources#faq" })),
  ...VIDEO_HIGHLIGHTS.map((v, i) => ({ id: `video-${i}`, group: "Video highlights" as const, title: v.title, description: `${v.time} · ${v.highlight}`, keywords: v.transcript, href: `${WALKTHROUGH_URL}&t=${v.start}s`, external: true })),
  { id: "guided-demo", group: "Resources", title: "Launch guided demo", description: "Interactive Storylane click-through of Zendesk Contact Center.", keywords: "storylane", href: DEMO_URL, external: true },
  ...RESOURCES.filter((r) => r.url !== DEMO_URL).map((r) => ({ id: `res-${r.id}`, group: "Resources" as const, title: r.title, description: `${r.category} · ${r.kind}`, href: r.url, external: true })),
];

export const SEARCH_GROUPS: SearchGroup[] = ["Pages", "Sections", "Features", "Use cases", "FAQ", "Video highlights", "Resources"];
