import type { DemoStage } from "@/lib/demo-playback";

export type NuggetId = "voice-copilot" | "voice-qa" | "voice-ai-agents" | "video-screen-sharing";
export type DemoNugget = { id: NuggetId; title: string; description: string; stages: readonly DemoStage[] };

/** Prepared visual sequences; optional ElevenLabs speech is synthetic, not a call. */
export const DEMO_NUGGETS: readonly DemoNugget[] = [
  {
    id: "voice-copilot",
    title: "Voice Copilot",
    description: "Follow a sample returns call as customer context, conversation intent and knowledge guidance come together for the agent.",
    stages: [
      { id: "connected", label: "Call connected", description: "Terry asks for help returning an order. The agent sees the customer and call context.", durationMs: 2500 },
      { id: "intent", label: "Intent recognized", description: "A sample transcript reveals a returns request and neutral sentiment.", durationMs: 3000 },
      { id: "knowledge", label: "Knowledge surfaced", description: "An illustrative returns-and-refunds article is surfaced alongside the conversation.", durationMs: 3000 },
      { id: "guidance", label: "Guidance presented", description: "The copilot outlines the order check, return request and submission steps for the human agent.", durationMs: 4000 },
      { id: "wrap-up", label: "Agent ready to respond", description: "The suggested response and source stay visible. The human agent decides what to do next.", durationMs: 2500 },
    ],
  },
  {
    id: "voice-qa",
    title: "Voice QA",
    description: "Review a sample voice conversation and explore illustrative spotlights for churn risk, product issues and exceptional service.",
    stages: [
      { id: "conversation", label: "Conversation captured", description: "A sample customer asks to return a bag of coffee; the agent confirms order 15023.", durationMs: 3000 },
      { id: "review", label: "Conversation reviewed", description: "An illustrated quality review examines the sample conversation. No recording is uploaded or analyzed.", durationMs: 3000 },
      { id: "risk", label: "Churn risk spotlight", description: "A sample spotlight highlights a possible customer-retention follow-up, not a real assessment.", durationMs: 3000 },
      { id: "product", label: "Product issue spotlight", description: "An illustrative flag identifies a product-related follow-up for review.", durationMs: 3000 },
      { id: "service", label: "Exceptional service spotlight", description: "The final sample spotlight recognizes the agent confirming the order promptly.", durationMs: 3000 },
    ],
  },
  {
    id: "voice-ai-agents",
    title: "Voice AI Agents",
    description: "Follow a sample replacement conversation as an AI voice agent confirms the request and illustrates a coordinated resolution.",
    stages: [
      { id: "request", label: "Request understood", description: "A customer asks to replace a damaged item.", durationMs: 2500 },
      { id: "confirmation", label: "Customer confirms", description: "The customer agrees to a replacement and collection of the original item.", durationMs: 3000 },
      { id: "replacement", label: "Replacement created", description: "A simulated action marks the replacement as created. No order is actually changed.", durationMs: 3000 },
      { id: "pickup", label: "Pickup scheduled", description: "A second simulated action illustrates arranging a carrier pickup.", durationMs: 3000 },
      { id: "notification", label: "Confirmation sent", description: "A final simulated action illustrates sending the details. No email or notification is actually sent.", durationMs: 3500 },
    ],
  },
  {
    id: "video-screen-sharing",
    title: "Video calling & screen sharing",
    description: "Escalate a sample messaging conversation to video, preview audio and camera, and guide a customer through a shared setup window without losing ticket context.",
    stages: [
      { id: "invitation", label: "Invite from the ticket", description: "The human agent sends a video invitation in the existing messaging conversation.", durationMs: 4000 },
      { id: "preview", label: "Preview before joining", description: "Both participants can check audio and video before joining the browser-based call.", durationMs: 4000 },
      { id: "connected", label: "Connect on video", description: "The customer and agent meet on video while their ticket context stays visible.", durationMs: 4000 },
      { id: "select-screen", label: "Choose a window", description: "Select a prepared setup window to share. No real screen capture takes place.", durationMs: 4000 },
      { id: "sharing", label: "Guide with visual context", description: "The selected window and participant video remain visible together.", durationMs: 5000 },
      { id: "resolution", label: "Resolve in context", description: "The sample device is paired and the conversation remains on the same ticket.", durationMs: 4000 },
    ],
  },
];
