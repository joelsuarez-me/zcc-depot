import { LINKS } from "./content";
import { COMPETITORS } from "./competitors";

export type SubNavItem = { label: string; href: string; external?: boolean; logo?: string; children?: readonly SubNavItem[] };
export type NavItem = { href: string; label: string; children?: SubNavItem[] };

export const HOW_IT_WORKS_GUIDE: SubNavItem = { label: "How it works (Detailed)", href: "/resources/how-it-works" };
// Pages linked from within a menu's content rather than listed as submenu items.
export const NAV_RELATED_PAGES: Record<string, SubNavItem[]> = { Overview: [HOW_IT_WORKS_GUIDE], "Sales Enablement": [...COMPETITORS] };

export const NAV: NavItem[] = [
  {
    href: "/", label: "Overview", children: [
      { label: "Welcome", href: "/#overview" },
      { label: "Connected Platform", href: "/#platform" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Capabilities", href: "/#features" },
      { label: "Executive Overview", href: "/rooms/executive-overview" },
    ],
  },
  {
    href: "/architecture#data-flow", label: "Architecture", children: [
      { label: "Architecture Explorer", href: "/rooms/architecture-integrations" },
      { label: "System & Data Flow", href: "/architecture#data-flow" },
      { label: "Platform Components", href: "/architecture/components" },
      { label: "Detailed System Flow", href: "/architecture/system-overview" },
    ],
  },
  {
    href: "/sales", label: "Sales Enablement", children: [
      { label: "Contact Center vs. Voice", href: "/sales/contact-center-vs-voice" },
      { label: "Solution Brief", href: "/sell-sheet" },
      { label: "Pricing & Packaging", href: "/pricing" },
      { label: "Industry Use Cases", href: "/sales/use-cases-by-vertical" },
      { label: "Top Five Use Cases", href: "/rooms/use-cases" },
      { label: "Competitive Intelligence", href: "/resources/compete", children: COMPETITORS },
      { label: "Sales Presentation", href: "/resources#pitch-deck" },
    ],
  },
  {
    href: "/demos", label: "Demo Preparation", children: [
      { label: "Demo Blueprint", href: "/demos#agenda" },
      { label: "Guided Walkthrough", href: "/demos#guided-demo" },
      { label: "Demo Environment", href: "/demos/instance-details" },
      { label: "Customer Research", href: "/demos/brief" },
      { label: "Demo Agenda", href: "/agenda" },
    ],
  },
  {
    href: "/rooms/ai-automation", label: "Interactive Demos", children: [
      { label: "Feature Demos", href: "/demos/nuggets" },
      { label: "AI & Automation", href: "/rooms/ai-automation" },
      { label: "Agent Experience", href: "/rooms/agent-experience" },
      { label: "Supervisor Experience", href: "/resources/supervisor-command-center" },
      { label: "Call Routing", href: "/resources/routing" },
      { label: "Queue Callbacks", href: "/resources/callback" },
      { label: "Outbound Dialers", href: "/resources/outbound-dialers" },
      { label: "Video & Screen Sharing", href: "/demos/nuggets#video-screen-sharing" },
    ],
  },
  { href: "/resources", label: "Resources", children: [
    { label: "Documentation Library", href: "/resources#library" },
    { label: "Quick Connects", href: "/resources#quick-connects" },
    { label: "Amazon Connect Telecom Country Coverage", href: "/resources/amazon-connect-coverage" },
    { label: "Objection Handling", href: "/resources/objection-handling" },
    { label: "Zendesk Contact Center Hub", href: LINKS.contactCenterHub, external: true },
    { label: "AI Knowledge Suggestions", href: "/resources#ai-suggestions" },
    { label: "Product Updates · Internal", href: "/resources#collaboration" },
    { label: "Frequently Asked Questions", href: "/resources#faq" },
    { label: "Product Roadmap · Confidential", href: "/resources#roadmap" },
    { label: "Site Map", href: "/site-map" },
  ] },
];

export function isNavItemActive(item: NavItem, location: string) {
  const matches = (href: string) => {
    const path = href.split("#")[0];
    return path === "/" ? location === "/" : location === path || location.startsWith(`${path}/`);
  };
  const relatedOwner = Object.entries(NAV_RELATED_PAGES).find(([, links]) => links.some(child => matches(child.href)));
  if (relatedOwner) return item.label === relatedOwner[0];
  // A page's menu placement wins over its historic URL prefix. Fragment-only
  // shortcuts don't transfer ownership of the whole Resources/Demos page.
  const childOwner = NAV.find(group => group.children?.some(child =>
    !child.external && !child.href.includes("#") && matches(child.href)));
  if (childOwner) return item.href === childOwner.href;
  return matches(item.href);
}

/** Shared display labels; keep URL identity independent from menu wording. */
export function navigationLabel(href: string) {
  const children = NAV.flatMap(group => group.children ?? []);
  return children.find(child => child.href === href)?.label
    ?? children.flatMap(child => child.children ?? []).find(child => child.href === href)?.label
    ?? NAV.find(group => group.href.split("#")[0] === href)?.label;
}

// Native section links support both same-page hashes and cross-page entry.
export function sectionHref(item: SubNavItem) {
  return item.external ? item.href : `${import.meta.env.BASE_URL}${item.href.replace(/^\//, "")}`;
}
