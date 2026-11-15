import { LINKS } from "./content";
import { COMPETITORS } from "./competitors";

export type SubNavItem = { label: string; href: string; external?: boolean; logo?: string; children?: readonly SubNavItem[] };
export type NavItem = { href: string; label: string; children?: SubNavItem[] };

export const HOW_IT_WORKS_GUIDE: SubNavItem = { label: "How it works (Detailed)", href: "/resources/how-it-works" };
// Pages linked from within a menu's content rather than listed as submenu items.
export const NAV_RELATED_PAGES: Record<string, SubNavItem[]> = { Overview: [HOW_IT_WORKS_GUIDE], Resources: [...COMPETITORS] };

export const NAV: NavItem[] = [
  {
    href: "/", label: "Overview", children: [
      { label: "Overview", href: "/#overview" },
      { label: "One solution", href: "/#platform" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Features", href: "/#features" },
    ],
  },
  {
    href: "/architecture#data-flow", label: "Architecture", children: [
      { label: "System + data flow", href: "/architecture#data-flow" },
      { label: "Components", href: "/architecture/components" },
      { label: "Detailed system overview", href: "/architecture/system-overview" },
    ],
  },
  {
    href: "/sales", label: "Sales", children: [
      { label: "Contact Center vs. Voice", href: "/sales/contact-center-vs-voice" },
      { label: "Sell Sheet", href: "/sell-sheet" },
      { label: "Pricing", href: "/pricing" },
      { label: "Use Cases by Vertical", href: "/sales/use-cases-by-vertical" },
    ],
  },
  {
    href: "/demos", label: "Demos", children: [
      { label: "Demo Blueprint", href: "/demos#agenda" },
      { label: "Demo Click-Through", href: "/demos#guided-demo" },
      { label: "Demo Instance Details", href: "/demos/instance-details" },
      { label: "Demo Researcher", href: "/demos/brief" },
      { label: "Demo Agenda", href: "/agenda" },
      { label: "Demo Nuggets", href: "/demos/nuggets" },
    ],
  },
  {
    href: "/rooms/ai-automation", label: "Demo Rooms", children: [
      { label: "AI & Automation", href: "/rooms/ai-automation" },
      { label: "Agent Experience", href: "/rooms/agent-experience" },
      { label: "Supervisor Experience", href: "/resources/supervisor-command-center" },
      { label: "Routing", href: "/resources/routing" },
      { label: "Callbacks", href: "/resources/callback" },
      { label: "Dialers", href: "/resources/outbound-dialers" },
      { label: "Video Calling", href: "/demos/nuggets#video-screen-sharing" },
    ],
  },
  { href: "/resources", label: "Resources", children: [
    { label: "Site Map", href: "/site-map" },
    { label: "Compete", href: "/resources/compete", children: COMPETITORS },
    { label: "Top Five Use Cases", href: "/rooms/use-cases" },
    { label: "Resource library", href: "/resources#library" },
    { label: "Zendesk Contact Center Hub", href: LINKS.contactCenterHub, external: true },
    { label: "Agent knowledge", href: "/resources#ai-suggestions" },
    { label: "Latest news · per internal briefing", href: "/resources#collaboration" },
    { label: "Pitch Deck", href: "/resources#pitch-deck" },
    { label: "FAQ", href: "/resources#faq" },
    { label: "Roadmap · confidential", href: "/resources#roadmap" },
    { label: "Supervisor Command Center", href: "/resources/supervisor-command-center" },
  ] },
];

export function isNavItemActive(item: NavItem, location: string) {
  const matches = (href: string) => {
    const path = href.split("#")[0];
    return path === "/" ? location === "/" : location === path || location.startsWith(`${path}/`);
  };
  const relatedOwner = Object.entries(NAV_RELATED_PAGES).find(([, links]) => links.some(child => matches(child.href)));
  if (relatedOwner) return item.label === relatedOwner[0];
  return matches(item.href) || !!item.children?.some(child =>
    !child.external && !child.href.includes("#") && matches(child.href));
}

// Native section links support both same-page hashes and cross-page entry.
export function sectionHref(item: SubNavItem) {
  return item.external ? item.href : `${import.meta.env.BASE_URL}${item.href.replace(/^\//, "")}`;
}
