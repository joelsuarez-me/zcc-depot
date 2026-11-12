import { useEffect, type ReactNode } from "react";
import { Cloud, Layers, Sprout } from "lucide-react";
import { PageHero, Reveal } from "@/components/kit";

const title = "Pricing | ZCC Depot";
const description = "The three ways Zendesk Contact Center is sold: the Zendesk Contact Center bundle, Contact Center License (BYOA), and Contact Center Team.";

type Method = {
  id: string;
  num: string;
  name: string;
  tag: string;
  fit: string;
  body: ReactNode;
  icon: typeof Layers;
  tone: "forest" | "paper" | "lime";
};

const methods: Method[] = [
  {
    id: "bundle",
    num: "01",
    name: "Zendesk Contact Center",
    tag: "The bundle",
    fit: "Primary motion",
    icon: Layers,
    tone: "forest",
    body: (
      <>
        Zendesk Contact Center is sold in three main ways, depending on the customer’s situation. Our primary motion is <strong>Zendesk Contact Center</strong> — the bundle option where Zendesk sells Contact Center and Amazon Connect together on one contract.
      </>
    ),
  },
  {
    id: "byoa",
    num: "02",
    name: "Contact Center License",
    tag: "BYOA",
    fit: "Existing AWS relationship",
    icon: Cloud,
    tone: "paper",
    body: (
      <>
        If a customer already has an AWS relationship or wants to keep buying from Amazon directly, offer <strong>Contact Center License</strong>, the bring-your-own-Amazon option.
      </>
    ),
  },
  {
    id: "team",
    num: "03",
    name: "Contact Center Team",
    tag: "The lighter-weight path",
    fit: "Greenfield / net-new",
    icon: Sprout,
    tone: "lime",
    body: (
      <>
        For greenfield/net-new customers who don’t want the full Suite, <strong>Contact Center Team</strong> gives us a lighter-weight path into the deal.
      </>
    ),
  },
];

const tones = {
  forest: { bg: "on-dark bg-[#203524] text-[#F5F5F2]", sub: "text-[#F5F5F2]/75", badge: "bg-[#D1F470] text-[#11110D]", num: "text-[#D1F470]/20", chip: "border-[#D1F470]/40 text-[#D1F470]", icon: "bg-[#D1F470] text-[#203524]" },
  paper: { bg: "bg-[#F5F5F2] text-[#11110D]", sub: "text-[#11110D]/70", badge: "bg-[#203524] text-[#D1F470]", num: "text-[#203524]/10", chip: "border-[#203524]/30 text-[#203524]", icon: "bg-[#203524] text-[#D1F470]" },
  lime: { bg: "bg-[#D1F470] text-[#11110D]", sub: "text-[#11110D]/75", badge: "bg-[#11110D] text-[#D1F470]", num: "text-[#203524]/15", chip: "border-[#203524]/40 text-[#203524]", icon: "bg-[#203524] text-[#D1F470]" },
};

export default function Pricing() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const metadata = [
      ['meta[name="description"]', description],
      ['meta[property="og:title"]', title],
      ['meta[property="og:description"]', description],
      ['meta[name="twitter:title"]', title],
      ['meta[name="twitter:description"]', description],
    ].map(([selector, content]) => {
      const element = document.querySelector<HTMLMetaElement>(selector);
      const previous = element?.getAttribute("content") ?? "";
      element?.setAttribute("content", content);
      return { element, previous };
    });
    return () => {
      document.title = previousTitle;
      metadata.forEach(({ element, previous }) => element?.setAttribute("content", previous));
    };
  }, []);

  return (
    <>
      <PageHero eyebrow="Commercial motions" title="Pricing" lede="Three ways Zendesk Contact Center is sold. Pick the one that fits the customer’s situation.">
        <nav aria-label="Pricing methods" className="flex flex-wrap gap-2">
          {methods.map((m) => (
            <a key={m.id} href={`#${m.id}`} data-testid={`link-pricing-${m.id}`}
              className="mono rounded-full border border-[#D1F470]/35 px-3.5 py-1.5 text-xs text-[#F5F5F2] transition-colors hover:bg-[#D1F470] hover:text-[#11110D]">
              {m.num} · {m.name}
            </a>
          ))}
        </nav>
      </PageHero>

      {methods.map((m) => {
        const t = tones[m.tone];
        const Icon = m.icon;
        return (
          <section key={m.id} id={m.id} aria-labelledby={`${m.id}-title`} className={`relative overflow-hidden border-t border-[#11110D]/10 ${t.bg}`} data-testid={`section-pricing-${m.id}`}>
            {m.tone === "forest" && <div className="grid-lines absolute inset-0" aria-hidden />}
            <span aria-hidden className={`pointer-events-none absolute -right-4 -top-6 select-none text-[9rem] font-semibold leading-none tracking-tighter md:text-[13rem] ${t.num}`}>{m.num}</span>
            <div className="relative mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
              <Reveal className="grid gap-6 md:grid-cols-12 md:items-start">
                <div className="md:col-span-5">
                  <div className="eyebrow flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 ${t.badge}`}>{m.num}</span>{m.tag}
                  </div>
                  <h2 id={`${m.id}-title`} className="mt-4 text-3xl font-semibold leading-[1.08] tracking-tight md:text-4xl" data-testid={`text-pricing-name-${m.id}`}>{m.name}</h2>
                  <p className="serif mt-2 text-2xl italic">{m.tag}</p>
                </div>
                <div className="md:col-span-7">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-10 w-10 place-items-center rounded-full ${t.icon}`}><Icon className="h-4 w-4" aria-hidden /></span>
                    <span className={`mono rounded-full border px-3 py-1 text-xs uppercase tracking-wider ${t.chip}`}>{m.fit}</span>
                  </div>
                  <p className={`mt-5 max-w-2xl text-lg leading-relaxed ${t.sub}`} data-testid={`text-pricing-body-${m.id}`}>{m.body}</p>
                </div>
              </Reveal>
            </div>
          </section>
        );
      })}

      <div className="bg-[#F5F5F2]">
        <p className="mx-auto max-w-7xl px-5 py-8 text-xs leading-relaxed text-[#11110D]/55 md:px-8">
          Informational only. Confirm current packaging, availability, and commercial terms with Zendesk before sharing with customers.
        </p>
      </div>
    </>
  );
}
