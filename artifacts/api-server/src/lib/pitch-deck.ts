export const PITCH_DECK_PDF = "/objects/uploads/9b3a4154-30b2-44bf-be97-8213f0d882a9";

/** Exact product-deep-dive slides, excluding the divider and subsequent AWS deck. */
export const PITCH_SLIDES = [
  { title: "Ticketing", sourcePage: 35, objectPath: "/objects/uploads/18bf0601-66a1-4b7c-bdbb-906bde848705" },
  { title: "Knowledge", sourcePage: 36, objectPath: "/objects/uploads/d7afe8fc-5e16-453c-a41e-5af3cb165cbe" },
  { title: "AI maturity framework", sourcePage: 37, objectPath: "/objects/uploads/b2892549-fd10-45d8-aa4d-3e00614a1ef0" },
  { title: "Advanced routing", sourcePage: 38, objectPath: "/objects/uploads/827814a2-3ada-4654-be55-f32773ac2007" },
  { title: "Outbound", sourcePage: 39, objectPath: "/objects/uploads/fd3c4990-c94a-44c3-809e-b19a3d8032cb" },
  { title: "Voice AI agents", sourcePage: 40, objectPath: "/objects/uploads/014e4e24-690d-4765-96de-9f39d8051ddf" },
  { title: "Voice Copilot", sourcePage: 41, objectPath: "/objects/uploads/ea4c1d38-2c36-4785-9592-1c6eb4478f2a" },
  { title: "Multimodal", sourcePage: 42, objectPath: "/objects/uploads/135e4576-659c-40c0-8108-6413339f0784" },
  { title: "Quality assurance", sourcePage: 43, objectPath: "/objects/uploads/72aaadb5-f523-4e2e-9519-150c00a895f1" },
  { title: "Workforce management", sourcePage: 44, objectPath: "/objects/uploads/d7598471-85d0-44c0-a58a-0fe4d246628e" },
  { title: "Reporting and analytics", sourcePage: 45, objectPath: "/objects/uploads/79cfa5e2-5446-4969-b29e-a8f8a75abb51" },
  { title: "App builder", sourcePage: 46, objectPath: "/objects/uploads/d3e639e5-bed5-4304-944a-a59c7953a682" },
  { title: "Zendesk MCP client & server", sourcePage: 47, objectPath: "/objects/uploads/e3e98acf-dcb9-47db-b15a-b052fa716d1f" },
];

export const pitchDeck = {
  title: "Broader Zendesk Product Deep Dive",
  description: "The 13 product slides from the uploaded Contact Center pitch deck, preserved in their original order and design.",
  totalSlides: PITCH_SLIDES.length,
  pdfUrl: "/api/pitch-deck/pdf",
  slides: PITCH_SLIDES.map((slide, index) => ({
    number: index + 1, title: slide.title, sourcePage: slide.sourcePage,
    imageUrl: `/api/pitch-deck/slides/${index + 1}`,
  })),
};
