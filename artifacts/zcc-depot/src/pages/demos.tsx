import { DemoButton, PageHero, Reveal, Section } from "@/components/kit";
import { DemoBlueprint } from "@/components/demo-blueprint";

export default function Demos() {
  return (
    <>
      <PageHero eyebrow="Demos · Guided access" title={<>One journey. <span className="serif italic text-[#D1F470]">Seven connected stages.</span></>}
        lede="Guide your audience from the customer's first interaction through the agent experience, the architecture behind it, and the business impact. Then hand them the walkthrough.">
        <DemoButton />
        <a href="#blueprint" className="inline-flex items-center gap-2 rounded-full border border-[#F5F5F2]/25 px-5 py-3 text-sm font-semibold hover:border-[#D1F470] hover:text-[#D1F470]" data-testid="link-agenda">Demo Blueprint</a>
      </PageHero>

      <DemoBlueprint />

      <Section tone="forest">
        <div id="guided-demo" className="scroll-mt-28 grid gap-7">
          <Reveal>
            <div className="eyebrow mb-4 text-[#D1F470]">Demo Click-Through</div>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">Step inside the <span className="serif italic text-[#D1F470]">contact center experience.</span></h2>
            <p className="mt-3 max-w-3xl text-base text-[#F5F5F2]/70">Explore the guided Storylane walkthrough below.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div data-testid="card-demo-preview" className="overflow-hidden rounded-2xl border border-[#D1F470]/25 bg-white">
              <iframe src="https://zendesk.storylane.io/demo/contactcenter-feb2026-en-us?embed=inline" title="Zendesk Contact Center interactive Storylane demo" loading="lazy" allowFullScreen className="block aspect-[4/3] w-full border-0 md:aspect-video" data-testid="iframe-guided-demo" />
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
