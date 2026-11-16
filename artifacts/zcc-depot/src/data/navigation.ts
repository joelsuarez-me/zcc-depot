import { LINKS } from "./content";
import { COMPETITORS } from "./competitors";

export type SubNavItem = { label: string; href: string; external?: boolean; logo?: string; children?: readonly SubNavItem[] };
export type NavItem = { href: string; label: string; children?: SubNavItem[] };

export const HOW_IT_WORKS_GUIDE: SubNavItem = { label: "Detailed How It Works Guide", href: "/resources/how-it-works" };
// Pages linked from within a menu's content rather than listed as submenu items.
export const NAV_RELATED_PAGES: Record<string, SubNavItem[]> = { "Demo Center": [...COMPETITORS] };

export const NAV: NavItem[] = [
  {
    href: "/", label: "Platform Overview", children: [
      { label: "Welcome", href: "/#overview" },
      { label: "Connected Platform", href: "/#platform" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Executive Overview", href: "/rooms/executive-overview" },
      HOW_IT_WORKS_GUIDE,
    ],
  },
  {
    href: "/architecture", label: "Architecture", children: [
      { label: "System & Data Flow", href: "/architecture#data-flow" },
      { label: "Architecture Explorer", href: "/rooms/architecture-integrations", children: [
        { label: "Platform Components", href: "/architecture/components" },
        { label: "Detailed System Flow", href: "/architecture/system-overview" },
        { label: "Workload Layers", href: "/architecture/workload-layers" },
      ] },
    ],
  },
  {
    href: "/#features", label: "Capabilities", children: [
      { label: "Quick Connects", href: "/#quick-connects" },
      { label: "Screen Recording", href: "/#screen-recording" },
      { label: "Call Routing", href: "/resources/routing" },
      { label: "Queue Callbacks", href: "/resources/callback" },
      { label: "Outbound Dialers", href: "/resources/outbound-dialers" },
      { label: "AI & Automation", href: "/rooms/ai-automation" },
      { label: "Agent Experience", href: "/rooms/agent-experience" },
      { label: "Feature Demos", href: "/demos/nuggets" },
    ],
  },
  {
    href: "/sales/use-cases-by-vertical", label: "Use Cases", children: [
      { label: "Cross-Industry Scenarios", href: "/sales/use-cases-by-vertical#top-use-cases" },
      { label: "Industry Library", href: "/sales/use-cases-by-vertical#industries" },
      { label: "Search Use Cases", href: "/sales/use-cases-by-vertical#explore" },
    ],
  },
  {
    href: "/demos", label: "Demo Center", children: [
      { label: "Demo Blueprint", href: "/demos#agenda" },
      { label: "Guided Walkthrough", href: "/demos#guided-demo" },
      { label: "Demo Environment", href: "/demos/instance-details" },
      { label: "Demo Research", href: "/demos/brief" },
      { label: "Demo Agenda", href: "/agenda" },
      { label: "Sales Enablement", href: "/sales", children: [
        { label: "Solution Brief", href: "/sell-sheet" },
        { label: "Pricing & Packaging", href: "/pricing" },
        { label: "Competitive Intelligence", href: "/resources/compete" },
        { label: "Sales Presentation", href: "/resources#pitch-deck" },
      ] },
    ],
  },
  {
    href: "/resources", label: "Guides & Resources", children: [
      { label: "Reference Library", href: "/resources#library" },
      { label: "Operational Guides", href: "/resources#library", children: [
        { label: "Supervisor Command Center", href: "/resources/supervisor-command-center" },
      ] },
      { label: "Telephony & Number Management", href: "/resources#library", children: [
        { label: "Country Coverage", href: "/resources/amazon-connect-coverage" },
        { label: "RespOrg & Number Porting", href: "/resources/resporg-number-porting" },
        { label: "STIR/SHAKEN", href: "/resources/stir-shaken" },
      ] },
      { label: "AI Agent Voices", href: "/resources/ai-agent-voices" },
      { label: "Objection Handling", href: "/resources/objection-handling" },
      { label: "Zendesk Contact Center Hub", href: LINKS.contactCenterHub, external: true },
      { label: "Frequently Asked Questions", href: "/resources#faq" },
      { label: "Product Roadmap · Confidential", href: "/resources#roadmap" },
      { label: "Site Map", href: "/site-map" },
    ],
  },
];

export function flattenNavItems(items: readonly SubNavItem[] = []): SubNavItem[] {
  return items.flatMap(item => [item, ...flattenNavItems(item.children ?? [])]);
}

const hrefPath = (href: string) => href.split("#")[0] || "/";

export function isNavItemActive(item: NavItem, location: string, hash = "") {
  const groups = NAV;
  const fragmentOwner = hash
    ? groups.find(group => [group.href, ...flattenNavItems(group.children).map(child => child.href)].some(href => {
        const fragment = href.indexOf("#");
        return fragment >= 0 && hrefPath(href) === location && href.slice(fragment) === hash;
      }))
    : undefined;
  if (fragmentOwner) return item.href === fragmentOwner.href;
  const routeOwner = groups.find(group => flattenNavItems(group.children).some(child =>
    !child.external && !child.href.includes("#") && hrefPath(child.href) === location));
  if (routeOwner) return item.href === routeOwner.href;
  return groups.find(group => !group.href.includes("#") && hrefPath(group.href) === location)?.href === item.href;
}

/** Shared display labels; keep URL identity independent from menu wording. */
export function navigationLabel(href: string) {
  const children = NAV.flatMap(group => flattenNavItems(group.children));
  return children.find(child => child.href === href)?.label
    ?? NAV.find(group => group.href === href || hrefPath(group.href) === href)?.label;
}

// Native section links support both same-page hashes and cross-page entry.
export function sectionHref(item: SubNavItem) {
  return item.external ? item.href : `${import.meta.env.BASE_URL}${item.href.replace(/^\//, "")}`;
}
