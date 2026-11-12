import { Link2 } from "lucide-react";

/** Native fragments preserve the current route, base prefix and agenda query. */
export function SectionLink({ id, label, dark = false }: { id: string; label: string; dark?: boolean }) {
  return (
    <a href={`#${encodeURIComponent(id)}`} aria-label={`Direct link to ${label}`} title="Direct link to this section"
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full align-middle transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${dark ? "text-[#D1F470]/70 hover:bg-white/10 hover:text-[#D1F470]" : "text-[#203524]/60 hover:bg-[#203524]/10 hover:text-[#203524]"}`}
      data-testid={`link-section-${id}`}>
      <Link2 className="h-4 w-4" aria-hidden />
    </a>
  );
}
