import type { FeatureSource } from "./feature-types";

// The cited passages were read and compared with the claims on 2026-11-15.
// This is a documentation review, NOT a customer deployment / entitlement check.
const reviewed = "2026-11-15";
const aws = "https://docs.aws.amazon.com/connect/latest/adminguide/";
const zd = "https://support.zendesk.com/hc/en-us/articles/";
function source(id: string, label: string, href: string): FeatureSource {
  return { id, label, href, lastVerified: reviewed };
}
export const FEATURE_SOURCES = {
  components: source("components", "Zendesk: Contact Center components and integration boundaries", zd + "9829206009242"),
  calls: source("calls", "Zendesk: call controls, warm transfer, conferences and wrap-up", zd + "10946560449050"),
  services: source("services", "Zendesk: base versus optional AWS services", zd + "10342463822746"),
  assist: source("assist", "Zendesk: real-time AI suggestions, Copilot and live transcripts", zd + "10143999626394"),
  voiceAi: source("voice-ai", "Zendesk: Voice AI GA announcement and Contact Center exclusion", zd + "11183058023450"),
  translation: source("translation", "Zendesk: real-time voice translation EAP and limitations", zd + "11202642705434"),
  qa: source("qa", "Zendesk: post-call QA, transcription and redaction comparison", zd + "9475134529050"),
  writeback: source("writeback", "Zendesk: recordings and transcription writeback setup", zd + "9696142065306"),
  wfm: source("wfm", "Zendesk Workforce Management: forecasting, schedules and activity", "https://www.zendesk.com/service/workforce-management/"),
  quality: source("quality", "Zendesk Quality Assurance: reviews, coaching and entitlements", "https://www.zendesk.com/service/quality-assurance/"),
  routing: source("routing", "AWS: contact routing, profiles, priority and skills", aws + "connect-feature-overview.html#connect-intro-routing"),
  ivr: source("ivr", "AWS: conversational IVR and Amazon Lex", aws + "connect-feature-overview.html#connect-intro2"),
  outbound: source("outbound", "AWS: outbound campaigns and required configuration", aws + "connect-feature-overview.html#connect-intro-campaigns"),
  telephony: source("telephony", "AWS: telephony and number management", aws + "connect-feature-overview.html#connect-intro-telephony"),
  profiles: source("profiles", "AWS: Customer Profiles and external data sources", aws + "connect-feature-overview.html#connect-intro-uc"),
  flows: source("flows", "AWS: flow designer and Lambda integrations", aws + "connect-feature-overview.html#connect-intro-flowdesigner"),
  analytics: source("analytics", "AWS: real-time conversational analytics and sentiment", aws + "connect-feature-overview.html#connect-intro-rtc"),
  reports: source("reports", "AWS: reporting and metric definitions", aws + "connect-feature-overview.html#connect-intro-reporting"),
  callbacks: source("callbacks", "AWS: queued callbacks, priority, retries and limits", aws + "setup-queued-cb.html"),
  dtmf: source("dtmf", "AWS: storing and encrypting customer DTMF input", aws + "store-customer-input.html"),
  a2a: source("a2a", "AWS: agent collaboration tier, Lex V2, API and depth constraints", aws + "a2a-quotas.html"),
  resiliency: source("resiliency", "AWS: Global Resiliency access, supported regions and setup", aws + "setup-connect-global-resiliency.html"),
  security: source("security", "AWS: security and shared responsibility", aws + "security.html"),
  architecture: source("architecture", "AWS: architectural guidance and workload boundaries", aws + "architecture-guidance.html"),
} satisfies Record<string, FeatureSource>;
export type FeatureSourceId = keyof typeof FEATURE_SOURCES;
