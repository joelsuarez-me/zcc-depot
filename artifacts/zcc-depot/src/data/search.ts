import { DEMO_URL, FAQ, FEATURES, RESOURCES, USE_CASES } from "@/data/content";
import { VIDEO_HIGHLIGHTS, WALKTHROUGH_URL } from "@/data/video-highlights";

export type SearchGroup = "Pages" | "Sections" | "Features" | "Use cases" | "FAQ" | "Video highlights" | "Resources";
export type SearchEntry = { id: string; group: SearchGroup; title: string; description: string; keywords?: string; href: string; external?: boolean };

const page = (id: string, title: string, href: string, description: string, keywords = ""): SearchEntry => ({ id: `page-${id}`, group: "Pages", title, href, description, keywords });
const sec = (id: string, title: string, href: string, description: string, keywords = ""): SearchEntry => ({ id: `section-${id}`, group: "Sections", title, href, description, keywords });

const PAGES: SearchEntry[] = [
  page("home", "Overview", "/", "Zendesk Contact Center platform story, how it works, and features.", "home start platform"),
  page("demos", "Demos", "/demos", "Demo agenda, guided demo, video highlights, and pre-demo spotlight.", "demo storyline rooms"),
  page("instance", "Demo Instance Details", "/demos/instance-details", "Details for the shared demo instance.", "environment sandbox login setup"),
  page("architecture", "Architecture", "/architecture", "Amazon Connect, Lambda, data flow, components, and regional footprint.", "aws technical"),
  page("sales", "Sales", "/sales", "Use cases, outcomes, FAQ, roadmap, and go-to-market guidance.", "gtm business value"),
  page("resources", "Resources", "/resources", "Curated Help Center articles and dashboards guidance.", "docs documentation help center"),
  page("agenda", "Today’s Agenda", "/agenda", "Signed-in area for preparing and presenting customer agendas.", "sign in presentation meeting"),
];

const SECTIONS: SearchEntry[] = [
  sec("platform", "One solution", "/#platform", "Pillars of the unified contact center platform.", "pillars overview"),
  sec("how-it-works", "How it works", "/#how-it-works", "Call journey from customer to Agent Workspace.", "journey voice"),
  sec("features", "Features", "/#features", "Voice AI agents, copilots, translation, WEM, compliance.", "capabilities"),
  sec("demo-agenda", "Demo Agenda", "/demos#agenda", "Seven-room story map for a customer demo.", "rooms storyline"),
  sec("video-highlights", "Video highlights", "/demos#video-highlights", "Timestamped walkthrough chapters.", "youtube walkthrough"),
  sec("video", "Video calling & screen sharing", "/demos#video", "Visual channels for complex support conversations.", "video call screen sharing"),
  sec("spotlight", "Pre-demo spotlight", "/demos#spotlight", "What to prepare before the demo.", "prep"),
  sec("journey", "Call journey", "/architecture#journey", "From Amazon Connect to the Zendesk agent experience.", "flow"),
  sec("ai-suggestions", "Real-time AI suggestions", "/architecture#ai-suggestions", "Transcription and knowledge suggestions during calls.", "copilot"),
  sec("data-flow", "Architecture & data flow", "/architecture#data-flow", "Agent controls, customer context, and call records flows.", "lambda api gateway cognito ctr"),
  sec("components", "Core components", "/architecture#components", "Amazon Connect, app, identity, CloudFormation.", "cognito saml lambdas"),
  sec("footprint", "Regional footprint", "/architecture#footprint", "Supported AWS regions.", "regions data residency"),
  sec("collaboration", "Agent-to-Agent collaboration", "/architecture#collaboration", "Specialist AI agent delegation and handoffs in Amazon Connect.", "orchestrator agents"),
  sec("use-cases", "Use cases", "/sales#use-cases", "Customer scenarios and outcomes.", "scenarios value"),
  sec("outcomes", "Customer outcomes", "/sales#outcomes", "Proof points from customers.", "stats TELUS SupportZebra Good Meal"),
  sec("operating-model", "Operating model", "/sales#operating-model", "How the solution is run and supported.", "support"),
  sec("faq", "FAQ", "/sales#faq", "Common customer questions.", "questions"),
  sec("roadmap", "Roadmap", "/sales#roadmap", "Executive, technical, and internal roadmap views.", "2026 future"),
  sec("guidance", "Presenter guidance", "/sales#guidance", "GTM guide: discovery, positioning, objections.", "gtm qualification pricing"),
  sec("dashboards", "Dashboards", "/resources#dashboards", "Contact Center dashboards app and reporting.", "analytics reporting"),
  sec("library", "Resource library", "/resources#library", "Browse and filter the official documentation collection.", "documentation articles"),
];

export const SEARCH_INDEX: SearchEntry[] = [
  ...PAGES,
  ...SECTIONS,
  ...FEATURES.map((f, i) => ({ id: `feature-${i}`, group: "Features" as const, title: f.t, description: f.d, keywords: f.tag, href: "/#features" })),
  ...USE_CASES.map((u, i) => ({ id: `usecase-${i}`, group: "Use cases" as const, title: u.t, description: u.scenario, keywords: [...u.outcome, ...u.enables].join(" "), href: "/sales#use-cases" })),
  ...FAQ.map(([q, a], i) => ({ id: `faq-${i}`, group: "FAQ" as const, title: q, description: a, href: "/sales#faq" })),
  ...VIDEO_HIGHLIGHTS.map((v, i) => ({ id: `video-${i}`, group: "Video highlights" as const, title: v.title, description: `${v.time} · ${v.highlight}`, keywords: v.transcript, href: `${WALKTHROUGH_URL}&t=${v.start}s`, external: true })),
  { id: "guided-demo", group: "Resources", title: "Launch guided demo", description: "Interactive Storylane click-through of Zendesk Contact Center.", keywords: "storylane", href: DEMO_URL, external: true },
  ...RESOURCES.filter((r) => r.url !== DEMO_URL).map((r) => ({ id: `res-${r.id}`, group: "Resources" as const, title: r.title, description: `${r.category} · ${r.kind}`, href: r.url, external: true })),
];

export const SEARCH_GROUPS: SearchGroup[] = ["Pages", "Sections", "Features", "Use cases", "FAQ", "Video highlights", "Resources"];
