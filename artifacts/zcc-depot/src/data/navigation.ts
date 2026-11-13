import { LINKS } from "./content";

export type SubNavItem = { label: string; href: string; external?: boolean };
export type NavItem = { href: string; label: string; children?: SubNavItem[] };

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
    ],
  },
  {
    href: "/sales", label: "Sales", children: [
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
  { href: "/resources", label: "Resources", children: [
    { label: "Resource library", href: "/resources#library" },
    { label: "Zendesk Contact Center Hub", href: LINKS.contactCenterHub, external: true },
    { label: "Agent knowledge", href: "/resources#ai-suggestions" },
    { label: "Latest news · per internal briefing", href: "/resources#collaboration" },
    { label: "Pitch Deck", href: "/resources#pitch-deck" },
    { label: "FAQ", href: "/resources#faq" },
    { label: "Roadmap · confidential", href: "/resources#roadmap" },
  ] },
];

export function isNavItemActive(item: NavItem, location: string) {
  const matches = (href: string) => {
    const path = href.split("#")[0];
    return path === "/" ? location === "/" : location === path || location.startsWith(`${path}/`);
  };
  return matches(item.href) || !!item.children?.some(child =>
    !child.external && !child.href.includes("#") && matches(child.href));
}

// Native section links support both same-page hashes and cross-page entry.
export function sectionHref(item: SubNavItem) {
  return item.external ? item.href : `${import.meta.env.BASE_URL}${item.href.replace(/^\//, "")}`;
}
