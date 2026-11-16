import { useEffect } from "react";
import { ArrowDown, ArrowUpRight, Layers3 } from "lucide-react";
import { Ext, Note, PageHero, Section, SectionHead } from "@/components/kit";
import { WorkloadLayerDiagrams } from "@/components/workload-layer-diagrams";

export default function ArchitectureWorkloadLayers() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Amazon Connect Workload Layers | ZCC Depot";
    return () => { document.title = previous; };
  }, []);

  return <>
    <PageHero motif="map" eyebrow="Architecture · Platform Components" title={<>Amazon Connect <span className="serif italic text-[#D1F470]">Workload Layers</span></>}
      lede="Break down the contact center into five operational layers, then trace how voice, interfaces, contact flows, agent endpoints, and reporting fit together.">
      <a href="#layer-map" className="rounded-full bg-[#D1F470] px-5 py-3 text-sm font-semibold text-[#11110D]">Explore the layers<ArrowDown className="ml-2 inline h-4 w-4" aria-hidden /></a>
      <a href="/architecture/components" className="rounded-full border border-[#F5F5F2]/25 px-5 py-3 text-sm font-semibold hover:border-[#D1F470] hover:text-[#D1F470]"><Layers3 className="mr-2 inline h-4 w-4" aria-hidden />Platform Components</a>
    </PageHero>

    <Section id="layer-map">
      <SectionHead permalinkId="layer-map" num="01" eyebrow="Workload model" title="Five layers. Clearer ownership." lede="Use the model to frame architecture reviews, troubleshooting, and responsibility boundaries. Select any layer to jump to its recreated diagrams." />
      <WorkloadLayerDiagrams />
      <Note>
        These diagrams are original visual recreations of the AWS workload-layer illustrations. They explain the documented concepts and are illustrative; the exact services, paths, ownership, and integrations depend on the configured deployment.
        {" "}<Ext href="https://docs.aws.amazon.com/connect/latest/adminguide/workload-layers.html" className="font-semibold underline">AWS workload layers guide<ArrowUpRight className="ml-1 inline h-3.5 w-3.5" aria-hidden /></Ext>
      </Note>
    </Section>
  </>;
}
