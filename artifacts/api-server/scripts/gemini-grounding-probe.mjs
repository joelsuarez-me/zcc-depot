// Manual integration check only. This performs one billable managed-AI request.
import { ai } from "../../../lib/integrations-gemini-ai/src/client.ts";
const result = await ai.models.generateContent({
  model: "gemini-3.8-flash",
  contents: "Use Google Search to verify the year Zendesk was founded. Answer in one sentence using a current official Zendesk source.",
  config: { tools: [{ googleSearch: {} }], maxOutputTokens: 8192, httpOptions: { timeout: 60000 } },
});
const grounding = result.candidates?.[0]?.groundingMetadata;
console.log(JSON.stringify({
  textLength: result.text?.length ?? 0,
  searchQueries: grounding?.webSearchQueries ?? [],
  sources: grounding?.groundingChunks?.map(chunk => chunk.web),
  supportCount: grounding?.groundingSupports?.length ?? 0,
  finishReason: result.candidates?.[0]?.finishReason,
}));
