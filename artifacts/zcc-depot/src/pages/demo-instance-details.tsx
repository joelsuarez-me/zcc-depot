import { useEffect } from "react";
import { Cloud, Monitor, Phone, Video } from "lucide-react";
import { Ext, PageHero, Reveal, Section } from "@/components/kit";

const description = "Zendesk and Amazon Connect instance links, demo phone numbers, and their associated contact flows.";

const instances = [
  {
    id: "zendesk",
    label: "Zendesk Instance",
    address: "z4nuselove.zendesk.com/agent/dashboard",
    href: "https://z4nuselove.zendesk.com/agent/dashboard",
    icon: Monitor,
  },
  {
    id: "connect",
    label: "Connect Instance",
    address: "lovekesh-zd.my.connect.aws",
    href: "https://lovekesh-zd.my.connect.aws",
    icon: Cloud,
  },
];

const phoneNumbers = [
  { id: "ai-voice", label: "AI Voice", number: "+1 778-216-3151", flow: "Demo1 (AI Voice)", icon: Phone },
  { id: "video", label: "Video Call Demo", number: "+1 334-719-2591", flow: "Video for Zendesk (Video Call Demo)", icon: Video },
];

export default function DemoInstanceDetails() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Demo Instance Details | ZCC Depot";
    const metadata = [
      ['meta[name="description"]', description],
      ['meta[property="og:title"]', "Demo Instance Details | ZCC Depot"],
      ['meta[property="og:description"]', description],
      ['meta[name="twitter:title"]', "Demo Instance Details | ZCC Depot"],
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
      <PageHero eyebrow="Demo environment" title="Demo Instance Details" lede="Your instance links, demo phone numbers, and contact flows in one place." />
      <Section>
        <div className="mb-8">
          <div className="eyebrow text-[#203524]/65">Instance access</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Open the demo environment</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#11110D]/65">Both instance links open in a new tab. Sign in to the corresponding service if prompted.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {instances.map(({ id, label, address, href, icon: Icon }, index) => (
            <Reveal key={id} delay={index * 0.06} className="flex flex-col rounded-[1.75rem] border border-[#203524]/15 bg-[#FBFBF8] p-6 md:p-8">
              <Icon className="h-6 w-6 text-[#203524]" aria-hidden />
              <h3 className="mt-5 text-2xl font-semibold">{label}</h3>
              <p className="mono mt-3 break-all text-sm text-[#11110D]/65" data-testid={`text-instance-address-${id}`}>{address}</p>
              <Ext href={href} testId={`link-demo-instance-${id}`} className="mt-7 w-fit rounded-full bg-[#203524] px-5 py-3 text-sm font-semibold text-[#D1F470] transition-colors hover:bg-[#2b4630]">
                Open {id === "zendesk" ? "Zendesk" : "Connect"} instance
              </Ext>
            </Reveal>
          ))}
        </div>
        <div className="mb-8 mt-16">
          <div className="eyebrow text-[#203524]/65">Demo phone numbers</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Contact flows / IVR</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {phoneNumbers.map(({ id, label, number, flow, icon: Icon }, index) => (
            <Reveal key={id} delay={index * 0.06} className="rounded-[1.75rem] border border-[#203524]/15 bg-white p-6 md:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#D1F470] text-[#203524]"><Icon className="h-4 w-4" aria-hidden /></span>
                <h3 className="text-xl font-semibold">{label}</h3>
              </div>
              <dl className="mt-6 space-y-5">
                <div>
                  <dt className="text-xs font-medium text-[#11110D]/55">Phone Number</dt>
                  <dd className="mt-1.5 text-2xl font-semibold tracking-tight text-[#203524] sm:text-3xl" data-testid={`text-demo-phone-${id}`}>{number}</dd>
                </div>
                <div className="border-t border-[#203524]/10 pt-5">
                  <dt className="text-xs font-medium text-[#11110D]/55">Contact flow / IVR</dt>
                  <dd className="mt-1.5 text-base font-medium text-[#203524]" data-testid={`text-demo-flow-${id}`}>{flow}</dd>
                </div>
              </dl>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
