import { Building2, Briefcase, HandHeart, HeartPulse, Landmark, Laptop, Microscope, Plane, Radio, Zap, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = { Landmark, HeartPulse, Building2, Laptop, Zap, Plane, Radio, HandHeart, Microscope };

export function IndustryIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Briefcase;
  return <Icon className={className} aria-hidden />;
}
