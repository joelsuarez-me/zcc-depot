import { useEffect } from "react";
import { ArrowDown, ArrowUpRight, AudioLines, Globe2, Languages, Mic2 } from "lucide-react";
import { Ext, Note, PageHero, Section, SectionHead } from "@/components/kit";

const providers = [
  {
    id: "amazon",
    name: "Amazon Nova Sonic",
    model: "Amazon Nova 2 Sonic",
    logo: "https://cdn.simpleicons.org/amazonaws",
    color: "#F59E0B",
    summary: "Real-time speech-to-speech model for conversational voice agents. Nova 2 Sonic documents voices across seven languages and ten locales.",
    languages: "English (US, UK, Australia, India), French, Italian, German, Spanish (US), Portuguese (Brazil), and Hindi.",
    accents: "Documented regional variants include US, UK, Australian, and Indian English; Spanish (US); Brazilian Portuguese; and locale-specific French, Italian, and German voices. Individual voice availability varies by locale.",
    preview: "https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-conversational-speech.html",
    previewLabel: "Hear the model in AWS docs",
    source: "https://docs.aws.amazon.com/nova/latest/nova2-userguide/sonic-language-support.html",
    sourceLabel: "AWS voice and locale list",
    voices: "Tiffany, Matthew, Amy, Olivia, Kiara, Arjun, Ambre, Florian, Beatrice, Lorenzo, Tina, Lennart, Lupe, Carlos, Carolina, and Leo",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    model: "Eleven v4 / Voice Library",
    logo: "https://cdn.simpleicons.org/elevenlabs",
    color: "#111827",
    summary: "A broad voice catalog with selectable samples and filters for language, accent, style, age, and use case.",
    languages: "Eleven v4 supports 90+ languages. Other models have different coverage: multilingual v2 supports 29, Flash v2.5 supports 32, and v3 supports 70+.",
    accents: "Accents are tied to the selected voice and available through the Voice Library’s accent filters. Examples include American, British, Australian, Indian, Mexican Spanish, and Castilian Spanish; the catalog changes over time.",
    preview: "https://elevenlabs.io/voice-library",
    previewLabel: "Preview the voice library",
    source: "https://elevenlabs.io/docs/overview/capabilities/voices",
    sourceLabel: "ElevenLabs languages and voices",
    voices: "Browse individual community and curated voices; samples are available in the library.",
  },
  {
    id: "deepgram",
    name: "Deepgram",
    model: "Aura and Flux TTS",
    logo: "https://cdn.simpleicons.org/deepgram",
    color: "#13A9E5",
    summary: "Text-to-speech voices designed for conversational applications. Aura-2 and Flux catalogs have distinct language and voice coverage.",
    languages: "Aura-2 includes English and Spanish, with additional documented support for Dutch, German, French, Italian, and Japanese. Check the current model catalog because coverage can differ by deployment and model.",
    accents: "Voice-specific accents include American and British English; Spanish voice options are also listed. Deepgram’s live catalog shows the current voice names and sample controls.",
    preview: "https://developers.deepgram.com/docs/flux-tts/voices",
    previewLabel: "Preview Deepgram voices",
    source: "https://developers.deepgram.com/docs/flux-tts/voices",
    sourceLabel: "Deepgram voices and accents",
    voices: "Example Flux voices include Hannah (American English), Kit (British English), and Alexis (American English).",
  },
  {
    id: "openai",
    name: "OpenAI",
    model: "Text-to-speech and Realtime voices",
    logo: "https://cdn.simpleicons.org/openai",
    color: "#10A37F",
    summary: "Built-in speech voices for generated audio and real-time applications, with an interactive demo for listening.",
    languages: "OpenAI documents speech generation across dozens of languages. The built-in voices are currently optimized for English.",
    accents: "The API can be prompted to control accent with compatible models, but OpenAI does not publish a fixed regional accent list for each built-in voice. The actual accent depends on model and instructions.",
    preview: "https://openai.fm/",
    previewLabel: "Preview voices in OpenAI.fm",
    source: "https://developers.openai.com/api/docs/guides/text-to-speech",
    sourceLabel: "OpenAI voice and language guide",
    voices: "13 built-in voices: Alloy, Ash, Ballad, Coral, Echo, Fable, Nova, Onyx, Sage, Shimmer, Verse, Marin, and Cedar. OpenAI recommends Marin or Cedar for best quality.",
  },
];

function ProviderCard({ provider }: { provider: typeof providers[number] }) {
  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-[#11110D]/10 bg-[#FBFBF8] p-6 transition hover:-translate-y-1 hover:shadow-[0_20px_50px_-28px_rgba(17,17,13,.38)] md:p-7">
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: provider.color }} />
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <img src={provider.logo} alt="" className="h-9 w-9 object-contain" loading="lazy" />
          </div>
          <div><p className="eyebrow text-[#203524]/60">{provider.model}</p><h3 className="mt-1 text-xl font-semibold tracking-tight">{provider.name}</h3></div>
        </div>
        <span className="rounded-full bg-[#EAF2DB] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#203524]">Voice catalog</span>
      </div>
      <p className="mt-5 min-h-[3.5rem] text-sm leading-relaxed text-[#11110D]/70">{provider.summary}</p>
      <div className="mt-5 grid gap-4 border-t border-[#11110D]/8 pt-5">
        <div className="flex gap-3"><Languages className="mt-0.5 h-4 w-4 shrink-0 text-[#355B3A]" /><div><p className="text-xs font-semibold uppercase tracking-wide text-[#203524]">Languages</p><p className="mt-1 text-sm leading-relaxed text-[#11110D]/70">{provider.languages}</p></div></div>
        <div className="flex gap-3"><Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-[#355B3A]" /><div><p className="text-xs font-semibold uppercase tracking-wide text-[#203524]">Accents and regional voices</p><p className="mt-1 text-sm leading-relaxed text-[#11110D]/70">{provider.accents}</p></div></div>
        <div className="rounded-2xl bg-[#F2F2ED] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#203524]">Catalog notes</p><p className="mt-1 text-sm leading-relaxed text-[#11110D]/70">{provider.voices}</p></div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Ext href={provider.preview} className="inline-flex items-center gap-2 rounded-full bg-[#203524] px-4 py-2.5 text-sm font-semibold text-[#D1F470] transition hover:bg-[#2D4831]">{provider.previewLabel}<AudioLines className="h-4 w-4" aria-hidden /><span className="sr-only"> (opens in a new tab)</span></Ext>
        <Ext href={provider.source} className="inline-flex items-center gap-2 rounded-full border border-[#203524]/20 px-4 py-2.5 text-sm font-semibold text-[#203524] hover:border-[#203524]">Provider details<ArrowUpRight className="h-4 w-4" aria-hidden /><span className="sr-only"> (opens in a new tab)</span></Ext>
      </div>
    </article>
  );
}

export default function ResourceAIAgentVoices() {
  useEffect(() => {
    const priorTitle = document.title;
    document.title = "AI Agent Voices | ZCC Depot";
    return () => { document.title = priorTitle; };
  }, []);
  return (
    <>
      <PageHero eyebrow="Resources · AI voice" title={<>A voice that sounds <span className="serif italic text-[#D1F470]">right for your customers.</span></>} lede="Explore the voice catalogs from Amazon Nova Sonic, ElevenLabs, Deepgram, and OpenAI. Compare documented languages and regional voice options, then open each provider’s interactive preview.">
        <a href="#provider-catalog" className="rounded-full bg-[#D1F470] px-5 py-3 text-sm font-semibold text-[#11110D]">Explore the voice catalogs<ArrowDown className="ml-2 inline h-4 w-4" aria-hidden /></a>
        <a href="#preview" className="rounded-full border border-[#F5F5F2]/25 px-5 py-3 text-sm font-semibold hover:border-[#D1F470] hover:text-[#D1F470]">How to preview voices</a>
      </PageHero>

      <Section id="overview">
        <SectionHead permalinkId="overview" num="01" eyebrow="Voice talent explorer" title="Listen for the experience you want to create" lede="A voice is more than a language setting. Compare tone, cadence, accent, and clarity using provider-hosted demos, then confirm the voice and model supported by your own deployment." />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-[#203524] p-6 text-white"><Mic2 className="h-6 w-6 text-[#D1F470]" /><p className="mt-4 text-2xl font-semibold">Preview voices</p><p className="mt-2 text-sm leading-relaxed text-white/70">Each catalog card links to a provider’s own demo or voice samples so you can hear the available talent.</p></div>
          <div className="rounded-3xl border border-[#203524]/15 bg-[#FBFBF8] p-6"><Languages className="h-6 w-6 text-[#355B3A]" /><p className="mt-4 text-2xl font-semibold">Compare language fit</p><p className="mt-2 text-sm leading-relaxed text-[#11110D]/70">Support and pronunciation vary by model and voice. Regional variants matter for names, place references, and customer expectations.</p></div>
          <div className="rounded-3xl border border-[#203524]/15 bg-[#F7F0E5] p-6"><Globe2 className="h-6 w-6 text-[#355B3A]" /><p className="mt-4 text-2xl font-semibold">Choose deliberately</p><p className="mt-2 text-sm leading-relaxed text-[#11110D]/70">Listen to the same short script in each catalog and test with native speakers before selecting a production voice.</p></div>
        </div>
      </Section>

      <Section id="zendesk-voices">
        <SectionHead permalinkId="zendesk-voices" num="02" eyebrow="Zendesk voice AI agents" title="Preview Zendesk’s configured voices in the workspace" lede="Zendesk documents voice selection and in-dashboard voice samples for its Voice AI Agents experience. The provider catalogs below are separate preview destinations and should not be read as a list of vendors selectable in Zendesk." />
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="rounded-[2rem] bg-[#111A23] p-7 text-white lg:col-span-7">
            <p className="eyebrow text-[#D1F470]">Zendesk voice configuration</p>
            <h3 className="mt-3 text-2xl font-semibold">Set a default voice, then tune key locales</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/70">Zendesk’s published configuration guide describes default male- or female-sounding voices across supported languages, plus curated premium voices for selected locales. It also describes searching by language or locale and previewing samples directly in the AI agents workspace. Access is tied to the Voice AI Agents early access program and account rollout.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Ext href="https://support.zendesk.com/hc/en-us/articles/10849624262170-Announcing-voice-configuration-for-voice-AI-agents" className="inline-flex items-center gap-2 rounded-full bg-[#D1F470] px-4 py-2.5 text-sm font-semibold text-[#11110D]">Zendesk voice configuration<ArrowUpRight className="h-4 w-4" aria-hidden /></Ext>
              <Ext href="https://support.zendesk.com/hc/en-us/articles/10588277182618-Configuring-multi-language-support-for-voice-AI-agents" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white">Zendesk language setup<ArrowUpRight className="h-4 w-4" aria-hidden /></Ext>
            </div>
          </div>
          <div className="rounded-[2rem] border border-[#203524]/15 bg-[#EAF2DB] p-6 lg:col-span-5">
            <p className="eyebrow text-[#203524]/65">A note on provider names</p>
            <h3 className="mt-2 text-xl font-semibold">Catalog availability depends on the product</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#11110D]/70">Amazon Nova Sonic, ElevenLabs, Deepgram, and OpenAI are shown here as voice technology catalogs to explore. Their inclusion does not confirm a native Zendesk integration, account entitlement, or availability as a selectable Zendesk voice. Verify the supported choices in your Zendesk workspace and deployment documentation.</p>
          </div>
        </div>
      </Section>

      <Section tone="white" id="provider-catalog">
        <SectionHead permalinkId="provider-catalog" num="02" eyebrow="Provider catalogs" title="Languages, accents, and voice previews" lede="The options below describe each provider’s published catalog, not a promise that every voice is available in Zendesk or in your current Amazon Connect configuration." />
        <div className="grid gap-5 xl:grid-cols-2">
          {providers.map(provider => <ProviderCard key={provider.id} provider={provider} />)}
        </div>
        <Note>Catalogs and language coverage change frequently. Availability can depend on model version, account, region, and product integration. The demos open on provider sites; these previews are not recordings of a Zendesk production integration.</Note>
      </Section>

      <Section id="preview">
        <SectionHead permalinkId="preview" num="03" eyebrow="Try a fair comparison" title="Use one script across every preview" lede="A consistent phrase makes it easier to compare pronunciation, warmth, pacing, and how each voice handles contact-center language." />
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="rounded-[2rem] bg-[#111A23] p-7 text-white lg:col-span-7">
            <p className="eyebrow text-[#D1F470]">Suggested sample script</p>
            <blockquote className="mt-4 border-l-2 border-[#D1F470] pl-5 text-xl leading-relaxed">“Hello, thanks for calling. I can help with your recent order. Could you share the order number and the postal code on the account?”</blockquote>
            <p className="mt-4 text-sm leading-relaxed text-white/65">If the catalog lets you enter text, paste the script and keep the settings consistent. Try a local address, a person’s name, a date, and a dollar amount before making a choice.</p>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-[2rem] border border-[#203524]/15 bg-[#EAF2DB] p-6">
              <p className="eyebrow text-[#203524]/65">What to listen for</p>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#11110D]/75">
                {["Does the voice sound clear over a phone connection?", "Are names, numbers, dates, and addresses pronounced correctly?", "Does the selected regional voice fit your customer base?", "Does the pacing leave room for natural turn-taking?"].map(item => <li key={item} className="flex gap-2"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#355B3A]" />{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="white" id="sources">
        <SectionHead permalinkId="sources" num="04" eyebrow="Official provider sources" title="Check the current catalog" lede="Provider pages are the source of truth for model versions, preview availability, and language coverage." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {providers.map(provider => <Ext key={provider.id} href={provider.source} className="rounded-2xl border border-[#203524]/15 bg-[#FBFBF8] p-5 font-semibold text-[#203524] transition hover:border-[#203524]">{provider.name}<br /><span className="mt-1 inline-block text-sm font-normal text-[#11110D]/60">{provider.sourceLabel}</span><ArrowUpRight className="ml-2 inline h-4 w-4" aria-hidden /></Ext>)}
        </div>
      </Section>
    </>
  );
}
