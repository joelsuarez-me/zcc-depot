import { Activity, AudioLines, BellRing, Bot, Boxes, CalendarClock, ChartNoAxesCombined, CircleUserRound, ClipboardCheck, Database, FileCheck2, FileLock2, Fingerprint, Gauge, GitBranch, GitFork, Headset, HeartPulse, KeyRound, Languages, ListTree, MessagesSquare, Network, PanelsTopLeft, Phone, PhoneCall, PhoneForwarded, PhoneOutgoing, Route, ShieldAlert, ShieldCheck, Sparkles, Users, UsersRound, Workflow, type LucideIcon } from "lucide-react";

// Named imports keep the thousands of unused Lucide icons out of the landing bundle.
const featureIcons: Record<string, LucideIcon> = {
  Activity, AudioLines, BellRing, Bot, Boxes, CalendarClock, ChartNoAxesCombined, CircleUserRound,
  ClipboardCheck, Database, FileCheck2, FileLock2, Fingerprint, Gauge, GitBranch, GitFork,
  Headset, HeartPulse, KeyRound, Languages, ListTree, MessagesSquare, Network, PanelsTopLeft,
  Phone, PhoneCall, PhoneForwarded, PhoneOutgoing, Route, ShieldAlert, ShieldCheck, Sparkles,
  Users, UsersRound, Workflow,
};

export function FeatureIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const Icon = featureIcons[name] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
