import type { AnchorHTMLAttributes } from "react";
export function Link({ onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} onClick={event => { event.preventDefault(); onClick?.(event); }} />;
}
export function useLocation(): [string] { return ["/"]; }
