export type RoomId = "executive-overview" | "architecture-integrations" | "ai-automation" | "agent-experience" | "use-cases" | "technical-resources";

export type DepotRoom = {
  id: RoomId;
  n: string;
  title: string;
  short: string;
  href: string;
  summary: string;
  audience: string;
  sections: { id: string; label: string }[];
};

export const ROOMS: DepotRoom[] = [
  {
    id: "executive-overview", n: "01", title: "Executive Overview", short: "Executive", href: "/rooms/executive-overview",
    summary: "Why unified service matters, where Zendesk Contact Center fits, and how the value story unfolds.",
    audience: "CX leaders, executive sponsors",
    sections: [
      { id: "value-story", label: "Value story" },
      { id: "before-after", label: "Before and after" },
      { id: "pillars", label: "Platform pillars" },
      { id: "customer-proof", label: "Customer proof" },
      { id: "next-steps", label: "Next steps" },
    ],
  },
  {
    id: "architecture-integrations", n: "02", title: "Architecture & Integrations", short: "Architecture", href: "/rooms/architecture-integrations",
    summary: "Explore the Amazon Connect foundation, Zendesk integration points, identity, data flow, and deployment boundaries.",
    audience: "Platform architects, IT, security",
    sections: [
      { id: "zendesk-architecture-overview", label: "Zendesk Architecture Overview" },
      { id: "explorer", label: "Architecture explorer" },
      { id: "call-to-ticket", label: "Call to ticket" },
      { id: "identity", label: "Identity and access" },
      { id: "deployment", label: "CloudFormation" },
      { id: "integration-lambdas", label: "Integration functions" },
      { id: "live-flow", label: "Live data flow" },
    ],
  },
  {
    id: "ai-automation", n: "03", title: "AI & Automation", short: "AI", href: "/rooms/ai-automation",
    summary: "Walk the AI layers across a call: self-service, escalation, agent assist, wrap-up, and quality.",
    audience: "Operations, AI program owners",
    sections: [
      { id: "ai-walkthrough", label: "Call-length walkthrough" },
      { id: "capability-status", label: "Capability status" },
      { id: "quality-paths", label: "QA and Contact Lens" },
      { id: "orchestration", label: "Orchestration concepts" },
    ],
  },
  {
    id: "agent-experience", n: "04", title: "Agent Experience", short: "Agent", href: "/rooms/agent-experience",
    summary: "A guided Agent Workspace simulation: ring, context, conversation, wrap-up, and supervisor view.",
    audience: "Agents, team leads, supervisors",
    sections: [
      { id: "workspace-sim", label: "Workspace simulation" },
      { id: "ticket-lifecycle", label: "Ticket lifecycle" },
      { id: "supervisor", label: "Supervisor workflows" },
      { id: "demo-assets", label: "Demo assets" },
    ],
  },
  {
    id: "use-cases", n: "05", title: "Top Five Use Cases", short: "Use cases", href: "/rooms/use-cases",
    summary: "Five scenarios from challenge to outcome, with architecture, demo steps, and discovery questions.",
    audience: "Solution engineers, account teams",
    sections: [
      { id: "scenario-inbound", label: "Intelligent inbound" },
      { id: "scenario-ai-assisted", label: "AI-assisted service" },
      { id: "scenario-continuity", label: "Voice-to-digital" },
      { id: "scenario-productivity", label: "Agent productivity" },
      { id: "scenario-modernization", label: "Modernization" },
    ],
  },
  {
    id: "technical-resources", n: "06", title: "Technical Resources", short: "Resources", href: "/rooms/technical-resources",
    summary: "Searchable documentation, architecture references, implementation guides, demo assets, and FAQs.",
    audience: "Everyone on the deal team",
    sections: [
      { id: "resource-search", label: "Resource search" },
      { id: "architecture-references", label: "Architecture references" },
      { id: "demo-assets-library", label: "Demo assets" },
      { id: "technical-faq", label: "Technical FAQ" },
      { id: "enablement", label: "Enablement" },
    ],
  },
];

export const roomById = (id: RoomId) => ROOMS.find((r) => r.id === id)!;
export const roomByPath = (path: string) => ROOMS.find((r) => r.href === path);

/** Non-room routes, labeled for breadcrumbs and recents. */
export const ROUTE_LABELS: Record<string, { label: string; parent?: string }> = {
  "/": { label: "Home" },
  "/demos": { label: "Demos" },
  "/demos/instance-details": { label: "Instance details", parent: "/demos" },
  "/demos/brief": { label: "Demo Researcher", parent: "/demos" },
  "/demos/nuggets": { label: "Demo Nuggets", parent: "/demos" },
  "/architecture": { label: "Architecture" },
  "/architecture/components": { label: "Components", parent: "/architecture" },
  "/architecture/system-overview": { label: "Detailed System Overview & Data Flow", parent: "/architecture" },
  "/sales": { label: "Sales" },
  "/pricing": { label: "Pricing", parent: "/sales" },
  "/sell-sheet": { label: "Sell Sheet", parent: "/sales" },
  "/sales/use-cases-by-vertical": { label: "Use Cases by Vertical", parent: "/sales" },
  "/resources": { label: "Resources" },
  "/resources/how-it-works": { label: "How it Works", parent: "/resources" },
  "/resources/routing": { label: "Routing", parent: "/resources" },
  "/resources/callback": { label: "Callback", parent: "/resources" },
  "/agenda": { label: "Demo Agenda", parent: "/demos" },
  ...Object.fromEntries(ROOMS.map((r) => [r.href, { label: r.title, parent: "/rooms" }])),
  "/rooms": { label: "Rooms" },
};
