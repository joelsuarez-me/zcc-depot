import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

export function AgendaCardLogo({ src, company }: { src: string; company: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src) {
    return <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#e8ede2] text-[#43634a]" aria-label="No customer logo saved"><FileText className="h-5 w-5" aria-hidden /></div>;
  }

  return (
    <div className="flex h-16 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#d9ddd2] bg-white p-3" data-testid="agenda-card-logo">
      {failed
        ? <span role="status" className="text-center text-xs text-[#895646]">Logo unavailable</span>
        : <img src={src} alt={`${company} logo`} loading="lazy" className="block h-full w-full min-h-0 min-w-0 object-contain" onError={() => setFailed(true)} />}
    </div>
  );
}
