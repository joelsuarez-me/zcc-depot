import { NAV, NAV_RELATED_PAGES } from "./navigation";
import { INTRO_ROOMS, ROOMS, ROUTE_LABELS } from "./depot-rooms";
import { SEARCH_INDEX } from "./search";
import { SLIDES } from "./how-it-works";

export type SiteAccess = "public" | "presenter";
export type SiteDestination = { title: string; href: string; description: string; keywords: string; access: SiteAccess; external?: boolean };
export type SiteMapPage = SiteDestination & { sections: SiteDestination[] };
export type SiteMapGroup = { id: string; title: string; description: string; pages: SiteMapPage[] };

// Supplemental section anchors for the detailed labs, beyond the shared search index.
// Keep these tied to real section IDs; site-map tests check them against the page source.
export const SITE_MAP_SECTIONS: Record<string, string[]> = {
  "/": ["overview", "rooms", "platform", "how-it-works", "features"],
  "/architecture": ["data-flow", "components"],
  "/architecture/components": ["map", "sign-in"],
  "/architecture/system-overview": ["system-diagram"],
  "/demos": ["agenda", "guided-demo", "spotlight", "video"],
  "/demos/nuggets": ["library", "voice-copilot", "voice-qa", "voice-ai-agents", "video-screen-sharing"],
  "/sales": ["use-cases", "outcomes", "guidance"],
  "/sales/contact-center-vs-voice": ["summary", "capabilities", "fit", "discovery", "migration", "faq", "sources"],
  "/pricing": ["bundle", "byoa", "team", "costs", "commercial-notes", "pricing-sources"],
  "/resources": ["library", "ai-suggestions", "collaboration", "pitch-deck", "faq", "roadmap"],
  "/resources/how-it-works": SLIDES.map(slide => slide.id),
  "/resources/routing": ["methods", "simulator", "configure", "accuracy"],
  "/resources/callback": ["command-center", "experiences", "simulator", "architecture", "value", "configure", "accuracy"],
  "/resources/outbound-dialers": ["dialing-modes", "compare", "campaign-builder", "segmentation", "suppression", "compliance", "time-zones", "command-center", "multichannel", "answer-detection", "reporting", "zendesk", "industries"],
  "/resources/supervisor-command-center": ["command-center", "queues", "agents", "simulator", "interventions", "contact-flow", "service-level", "occupancy", "alerts", "analytics", "architecture", "zendesk", "playbooks"],
};
export const ROUTING_MAP_METHODS = [
  ["queue", "Queue-based routing"], ["skills", "Skills and proficiency routing"],
  ["priority", "Priority and delay routing"], ["longest", "Longest-available agent"],
  ["vip", "Customer attribute and VIP routing"], ["preferred", "Preferred-agent routing"],
  ["intent", "Intent-based routing"], ["hours", "Time-of-day and business hours"],
  ["overflow", "Overflow and escalation"], ["language", "Language-based routing"],
  ["capacity", "Omnichannel and capacity"], ["external", "Dynamic external-data routing"],
] as const;
const PAGE_HINTS: Record<string, { description: string; keywords: string }> = {
  "/resources/routing": { description: "Explore twelve routing methods and simulate how calls reach an eligible agent.", keywords: "skills proficiency VIP priority queue overflow language capacity Lex CRM Lambda" },
  "/resources/callback": { description: "Explore callback experiences, scheduling, queue behavior and a simulated command center.", keywords: "callbacks virtual hold queued immediate scheduled retry web form API consent" },
  "/resources/outbound-dialers": { description: "Compare dialing modes and explore campaign, segmentation and compliance simulations.", keywords: "predictive progressive preview agentless dialer outbound campaign suppression time zones answering machine detection" },
  "/resources/supervisor-command-center": { description: "Explore queue health, agent states, interventions, alerts and supervisor simulations.", keywords: "supervisor manager command center monitoring service level occupancy escalation coaching playbooks" },
  "/resources/how-it-works": { description: "A slide-by-slide technical guide to Amazon Connect and Zendesk Contact Center.", keywords: "detailed how it works technical guide Lex Contact Lens IVR queues architecture integration" },
  "/architecture/system-overview": { description: "Trace data between Zendesk, Amazon Connect and configured customer systems.", keywords: "detailed system overview data flow cloud Cognito Lambda profiles logs recordings" },
};
const SECTION_NAMES: Record<string, string> = {
  "ai-suggestions": "Agent knowledge", collaboration: "Latest news · internal briefing", roadmap: "Roadmap · confidential",
  "pitch-deck": "Pitch Deck", agenda: "Demo Blueprint", "guided-demo": "Demo Click-Through",
  byoa: "Bring your own Amazon", team: "Contact Center Team", bundle: "Contact Center bundle",
  "sign-in": "Identity and sign-in", map: "Interactive component map", faq: "FAQ",
  configure: "Configuration guides", accuracy: "Technical ground rules", fit: "Interactive fit guide",
  "video-screen-sharing": "Video calling & screen sharing", "voice-qa": "Voice QA",
  "voice-ai-agents": "Voice AI Agents", "voice-copilot": "Voice Copilot",
  "system-diagram": "Detailed system overview and data flow", "data-flow": "System + data flow",
  costs: "Cost components", "commercial-notes": "Terms to confirm", "pricing-sources": "Pricing source references",
  "contact-lens": "Amazon Connect Contact Lens", "amazon-lex": "Amazon Lex", "platform-and-aws": "Zendesk platform and AWS",
};
const GROUP_DESCRIPTIONS: Record<string, string> = {
  Intro: "Start with a guided room for your audience.",
  Overview: "Understand the platform story and connected-service capabilities.",
  Architecture: "Explore components, identity, integrations and data flow.",
  Sales: "Find product fit, business value and commercial guidance.",
  Demos: "Prepare, research and present a customer conversation.",
  "Demo Rooms": "Open hands-on feature and operational simulations.",
  Resources: "Find detailed guides, reference material and enablement.",
};
const PRIVATE_PATHS = new Set(["/pricing", "/sell-sheet", "/agenda", "/demos/brief"]);
const PRIVATE_SECTIONS = new Set(["/resources#roadmap", "/resources#collaboration", "/resources#pitch-deck", "/sales#guidance"]);
export function siteAccess(href: string): SiteAccess {
  return PRIVATE_PATHS.has(href.split("#")[0]) || PRIVATE_SECTIONS.has(href) ? "presenter" : "public";
}
function labelForId(id: string) {
  return SECTION_NAMES[id] ?? id.split("-").map(word => word === "aws" ? "AWS" : word === "qa" ? "QA" : word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
const routePaths = new Set(Object.keys(ROUTE_LABELS).filter(path => path !== "/rooms"));
const anchorsFor = (path: string) => new Set([
  ...(SITE_MAP_SECTIONS[path] ?? []),
  ...(ROOMS.find(room => room.href === path)?.sections.map(section => section.id) ?? []),
  ...(path === "/resources/routing" ? ROUTING_MAP_METHODS.map(([id]) => `method-${id}`) : []),
]);
function validDestination(href: string) {
  const [path, hash] = href.split("#");
  return routePaths.has(path) && (!hash || anchorsFor(path).has(hash));
}
function pageFor(path: string): SiteMapPage {
  const indexed = SEARCH_INDEX.find(entry => entry.group === "Pages" && entry.href === path);
  const room = ROOMS.find(entry => entry.href === path);
  const access = siteAccess(path);
  const title = path === "/" ? "Landing page" : room?.title ?? indexed?.title ?? ROUTE_LABELS[path]?.label ?? path;
  const sections = new Map<string, SiteDestination>();
  const add = (entry: SiteDestination) => {
    const previous = sections.get(entry.href);
    if (previous) {
      previous.keywords += ` ${entry.title} ${entry.description} ${entry.keywords}`;
    } else sections.set(entry.href, entry);
  };
  for (const id of anchorsFor(path)) {
    const href = `${path}#${id}`;
    const roomSection = room?.sections.find(section => section.id === id);
    const title = roomSection?.label
      ?? (path === "/resources/routing" ? ROUTING_MAP_METHODS.find(([key]) => id === `method-${key}`)?.[1] : undefined)
      ?? (path === "/resources/how-it-works" ? SLIDES.find(slide => slide.id === id)?.title : undefined)
      ?? labelForId(id);
    add({ title, href, description: siteAccess(href) === "presenter" ? "Presenter Mode and sign-in required." : `Explore ${title.toLowerCase()}.`, keywords: "", access: siteAccess(href) });
  }
  for (const entry of SEARCH_INDEX) {
    if (entry.external || entry.href === path || entry.href.split("#")[0] !== path || !validDestination(entry.href)) continue;
    const existing = sections.get(entry.href);
    const restricted = siteAccess(entry.href) === "presenter";
    if (existing && !restricted) existing.description = entry.description;
    add({ title: entry.title, href: entry.href, description: restricted ? "" : entry.description, keywords: restricted ? "" : entry.keywords ?? "", access: siteAccess(entry.href) });
  }
  // Keep detailed official references searchable without duplicating them as top-level pages.
  if (path === "/resources") {
    for (const entry of SEARCH_INDEX.filter(entry => entry.external && entry.group === "Resources")) {
      add({ title: entry.title, href: entry.href, description: entry.description, keywords: entry.keywords ?? "", access: "public", external: true });
    }
  }
  const navLinks = NAV.flatMap(group => group.children ?? []).filter(entry => entry.href.startsWith(`${path}#`));
  for (const entry of navLinks) {
    if (validDestination(entry.href) && sections.has(entry.href)) sections.get(entry.href)!.title = entry.label;
  }
  return {
    title, href: path, access, external: false, sections: [...sections.values()],
    description: access === "presenter" ? "Team workspace. Presenter Mode and sign-in required." : indexed?.description ?? room?.summary ?? PAGE_HINTS[path]?.description ?? `Browse ${title.toLowerCase()}.`,
    keywords: access === "presenter" ? "" : `${indexed?.keywords ?? ""} ${PAGE_HINTS[path]?.keywords ?? ""}`,
  };
}

export function buildSiteMap(): SiteMapGroup[] {
  const groups: SiteMapGroup[] = [{
    id: "intro", title: "Intro", description: GROUP_DESCRIPTIONS.Intro,
    pages: INTRO_ROOMS.map(room => pageFor(room.href)),
  }];
  for (const nav of NAV) {
    const paths = new Set([nav.href, ...(nav.children ?? []).filter(child => !child.external).map(child => child.href), ...(NAV_RELATED_PAGES[nav.label] ?? []).map(child => child.href)].map(href => href.split("#")[0]));
    const pages = [...paths].filter(path => routePaths.has(path)).map(pageFor);
    for (const entry of nav.children ?? []) {
      if (entry.external) pages.push({ title: entry.label, href: entry.href, description: "External enablement resource. Its own access requirements may apply.", keywords: "", access: "public", external: true, sections: [] });
    }
    if (pages.length) groups.push({ id: nav.label.toLowerCase().replace(/\s+/g, "-"), title: nav.label, description: GROUP_DESCRIPTIONS[nav.label] ?? "", pages });
  }
  const covered = new Set(groups.flatMap(group => group.pages.map(page => page.href)));
  // A new registered page must remain discoverable even before it gets its own menu link.
  const remaining = [...routePaths].filter(path => !covered.has(path));
  if (remaining.length) groups.push({ id: "more-pages", title: "More pages", description: "Additional destinations in the Depot.", pages: remaining.map(pageFor) });
  return groups;
}

export const SITE_MAP = buildSiteMap();
export function normalizeSiteQuery(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
const matches = (text: string, words: string[]) => words.every(word => normalizeSiteQuery(text).includes(word));
export function filterSiteMap(query: string, groups: SiteMapGroup[] = SITE_MAP): SiteMapGroup[] {
  const words = normalizeSiteQuery(query).split(/\s+/).filter(Boolean);
  if (!words.length) return groups;
  return groups.map(group => {
    const wholeGroup = matches(`${group.title} ${group.description}`, words);
    return { ...group, pages: group.pages.flatMap(page => {
      const wholePage = wholeGroup || matches(`${page.title} ${page.description} ${page.keywords} ${page.href}`, words);
      const sections = wholePage ? page.sections : page.sections.filter(section => matches(`${section.title} ${section.description} ${section.keywords} ${section.href}`, words));
      return wholePage || sections.length ? [{ ...page, sections }] : [];
    }) };
  }).filter(group => group.pages.length);
}
export function siteMapCounts(groups: SiteMapGroup[] = SITE_MAP) {
  const pages = new Set<string>(), sections = new Set<string>();
  for (const group of groups) for (const page of group.pages) {
    if (!page.external) pages.add(page.href);
    for (const section of page.sections) sections.add(section.href);
  }
  return { groups: groups.length, pages: pages.size, sections: sections.size };
}
