import type { DemoVoice, DemoVoiceLanguageAccent } from "@workspace/api-client-react";

export const MISSING_VOICE_LABEL = "__not_provided__";
export const voiceLabelKey = (value?: string) => value?.trim().toLowerCase() || MISSING_VOICE_LABEL;
export const voiceLanguageAccents = (voice: DemoVoice): DemoVoiceLanguageAccent[] =>
  voice.languageAccents?.length ? voice.languageAccents : [{}];

export function voiceLabelText(value: string, field: "language" | "accent"): string {
  if (value === MISSING_VOICE_LABEL) return "Not provided";
  if (field === "language" && /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(value)) {
    try { return new Intl.DisplayNames(["en"], { type: "language" }).of(value) ?? value; }
    catch { /* Preserve unrecognized provider labels rather than guessing. */ }
  }
  return value.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}

export function voiceFilterOptions(voices: DemoVoice[], field: "language" | "accent") {
  return [...new Set(voices.flatMap(voice => voiceLanguageAccents(voice).map(pair => voiceLabelKey(pair[field]))))]
    .map(value => ({ value, label: voiceLabelText(value, field) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function filterVoiceCatalog(voices: DemoVoice[], query: string, language: string, accent: string) {
  const q = query.trim().toLowerCase();
  return voices.filter(voice => (!q || voice.name.toLowerCase().includes(q)) &&
    voiceLanguageAccents(voice).some(pair =>
      (!language || voiceLabelKey(pair.language) === language) &&
      (!accent || voiceLabelKey(pair.accent) === accent)));
}
