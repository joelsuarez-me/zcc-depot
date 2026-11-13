export type ProofStory = {
  id: "good-meal" | "supportzebra" | "telus";
  co: string;
  logo: string;
  industry: string;
  place: string;
  art: "orders" | "workflow" | "messaging";
  headline: string;
  figures: { v: string; l: string; note?: string }[];
  figureLabel: string;
  challenges: string[];
  why: string[];
  context: string;
  quote?: { text: string; by: string; role: string };
};

const base = import.meta.env.BASE_URL;

export const PROOF: ProofStory[] = [
  {
    id: "good-meal", co: "The Good Meal Co", logo: `${base}brand/customer-proof/good-meal.png`,
    industry: "Food manufacturing · retail, wholesale and direct-to-consumer", place: "Sydney, Australia", art: "orders",
    headline: "A busy order line moved onto a scalable cloud foundation in five weeks.",
    figureLabel: "Reported context, not improvements",
    figures: [
      { v: "5 wks", l: "Reported implementation" },
      { v: "60%", l: "Orders via voice", note: "Channel mix" },
      { v: "40%", l: "Orders via web", note: "Channel mix" },
    ],
    challenges: [
      "High call volumes with limited self-service created ordering bottlenecks.",
      "Legacy telephony restricted analysis of customer data.",
      "Manual paperwork and admin slowed teams down.",
    ],
    why: [
      "A scalable cloud foundation for a voice-heavy order channel.",
      "More efficient workflows for the teams taking orders.",
    ],
    context: "Local Measure integrated Amazon Connect as part of the historical deployment. Hani Rifai described generative AI as forward-looking potential for call summaries and suggested next actions, not a measured delivered result.",
  },
  {
    id: "supportzebra", co: "SupportZebra", logo: `${base}brand/customer-proof/supportzebra.png`,
    industry: "BPO · corporate services · 1,500+ employees", place: "Houston, Texas", art: "workflow",
    headline: "Onboarding a nurse line exposed the limits of separate tools. One agent workflow answered it.",
    figureLabel: "Customer-reported results",
    figures: [
      { v: "30–50%", l: "Lower average handle time" },
      { v: "<5 min", l: "After-call work" },
      { v: "24/7", l: "Staff availability" },
    ],
    challenges: [
      "Onboarding TelemedRN nurses exposed limits in remote supervision and live-call monitoring.",
      "Voice, email and SMS ran in separate tools.",
      "No structured after-call work capture.",
    ],
    why: [
      "A unified agent workflow across channels.",
      "Configured AI and transcription.",
      "Flexible scaling with a consumption model.",
      "Consolidated reporting and training.",
    ],
    context: "Results reflect SupportZebra's configuration. This is not a claim of one universal routing engine, or that every capability is standard in every plan.",
  },
  {
    id: "telus", co: "TELUS", logo: `${base}brand/customer-proof/telus.png`,
    industry: "Telecommunications · B2C", place: "Vancouver, Canada", art: "messaging",
    headline: "Asynchronous messaging in the My TELUS app outperformed voice on resolution and wrap-up.",
    figureLabel: "Messaging compared with voice",
    figures: [
      { v: "+5 pts", l: "First-contact resolution", note: "Messaging vs voice" },
      { v: "50%+", l: "Less after-work time", note: "Messaging vs voice" },
      { v: "24/7", l: "Asynchronous availability" },
    ],
    challenges: [
      "Cost pressure alongside rising customer expectations.",
      "Demand peaks that voice queues absorb poorly.",
      "Driving My TELUS app adoption.",
      "Round-the-clock support expectations.",
    ],
    why: [
      "Asynchronous messaging inside the app customers already use.",
      "Configured generative AI.",
      "An extensible desktop integrated with a home-grown CRM.",
    ],
    context: "These are messaging-versus-voice comparisons, not telephony improvements.",
    quote: { text: "This partnership has introduced a first-class messaging system expertly blending AI efficiency with the best of personalized human support.", by: "Zainul Mawji", role: "Executive Vice-President, TELUS Consumer Solutions" },
  },
];
