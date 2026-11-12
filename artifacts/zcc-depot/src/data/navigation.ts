import { DEMO_URL } from "@/data/content";

export type SubNavItem = { label: string; href: string; external?: boolean };
export type NavItem = { href: string; label: string; children?: SubNavItem[] };

export const NAV: NavItem[] = [
  {
    href: "/", label: "Overview", children: [
      { label: "01: One solution", href: "/#platform" },
      { label: "02: How it works", href: "/#how-it-works" },
      { label: "03: Features", href: "/#features" },
    ],
  },
  {
    href: "/demos", label: "Demos", children: [
      { label: "Demo Agenda", href: "/demos#agenda" },
      { label: "Launch Guided Demo", href: DEMO_URL, external: true },
      { label: "Demo Instance Details", href: "/demos/instance-details" },
    ],
  },
  { href: "/architecture", label: "Architecture" },
  { href: "/sales", label: "Sales" },
  { href: "/resources", label: "Resources" },
  { href: "/agenda", label: "Today’s Agenda" },
];

// Native section links support both same-page hashes and cross-page entry.
export function sectionHref(item: SubNavItem) {
  return item.external ? item.href : `${import.meta.env.BASE_URL}${item.href.replace(/^\//, "")}`;
}
