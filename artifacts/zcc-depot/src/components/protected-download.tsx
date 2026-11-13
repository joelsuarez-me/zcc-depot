import { useState, type ButtonHTMLAttributes } from "react";
import { downloadProtected } from "@/lib/protected-asset";

export function ProtectedDownload({ url, filename, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  url: string; filename: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const run = async () => {
    setPending(true);
    setError("");
    try { await downloadProtected(url, filename); }
    catch { setError("The PDF could not be downloaded. Check that Presenter mode is on and your session is active, then retry."); }
    finally { setPending(false); }
  };
  return <>
    <button {...props} type="button" disabled={pending || props.disabled} aria-busy={pending} onClick={() => void run()}>
      {pending ? "Preparing PDF…" : children}
    </button>
    {error && <p role="alert" className="basis-full text-sm text-red-700">{error}</p>}
  </>;
}
