import type { DemoVoiceLanguageAccent } from "@workspace/api-zod";

export const DEMO_SPEECH_MODEL = "eleven_multilingual_v2";

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const label = (value: unknown) => typeof value === "string" ? value.trim().slice(0, 120) || undefined : undefined;

/** Keep language and accent paired; an accent verified in one language is not verified in every language. */
export function voiceCatalogMetadata(value: unknown): DemoVoiceLanguageAccent[] {
  const voice = record(value);
  const entries = [record(voice.labels), ...(Array.isArray(voice.verified_languages)
    ? voice.verified_languages.map(record).filter(entry => entry.model_id === DEMO_SPEECH_MODEL)
    : [])];
  const seen = new Set<string>();
  return entries.flatMap(entry => {
    const language = label(entry.language);
    const accent = label(entry.accent);
    if (!language && !accent) return [];
    const key = JSON.stringify([language?.toLowerCase(), accent?.toLowerCase()]);
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ ...(language ? { language } : {}), ...(accent ? { accent } : {}) }];
  });
}
