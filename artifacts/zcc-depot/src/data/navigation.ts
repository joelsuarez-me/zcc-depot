export type SubNavItem = { label: string; href: string; external?: boolean };
export type NavItem = { href: string; label: string; children?: SubNavItem[] };

export const NAV: NavItem[] = [
  {
    href: "/", label: "Overview", children: [
      { label: "01: One solution", href: "/#platform" },
      { label: "02: How it works", href: "/architecture#journey" },
      { label: "03: Features", href: "/#features" },
    ],
  },
  {
    href: "/architecture", label: "Architecture",
  },
  {
    href: "/sales", label: "Sales", children: [
      { label: "Sell Sheet", href: "/sell-sheet" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    href: "/demos", label: "Demos", children: [
      { label: "01 Demo Methodology", href: "/demos#agenda" },
      { label: "02 Demo Click-Through", href: "/demos#guided-demo" },
      { label: "03 Demo Instance Details", href: "/demos/instance-details" },
      { label: "04 Demo Researcher", href: "/demos/brief" },
      { label: "05 Demo Agenda", href: "/agenda" },
    ],
  },
  { href: "/resources", label: "Resources" },
];

export function isNavItemActive(item: NavItem, location: string) {
  const matches = (href: string) => href === "/"
    ? location === "/"
    : location === href || location.startsWith(`${href}/`);
  return matches(item.href) || !!item.children?.some(child =>
    !child.external && !child.href.includes("#") && matches(child.href));
}

// Native section links support both same-page hashes and cross-page entry.
export function sectionHref(item: SubNavItem) {
  return item.external ? item.href : `${import.meta.env.BASE_URL}${item.href.replace(/^\//, "")}`;
}
