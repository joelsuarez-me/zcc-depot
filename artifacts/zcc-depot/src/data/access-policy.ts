/** Public destination metadata is not authorization. Protected bytes remain server-only. */
const PRIVATE_PATHS = new Set(["/pricing", "/sell-sheet", "/agenda", "/demos/brief", "/resources/compete", "/resources/compete/five9", "/resources/objection-handling"]);
const PRIVATE_SECTIONS = new Set(["/resources#roadmap", "/resources#collaboration", "/resources#pitch-deck", "/sales#guidance"]);
export function destinationAccess(href: string): "public" | "presenter" {
  try {
    const url = new URL(href, "https://depot.invalid");
    return PRIVATE_PATHS.has(url.pathname) || PRIVATE_SECTIONS.has(url.pathname + url.hash) ? "presenter" : "public";
  } catch { return "presenter"; }
}
export function maySearchDestination(href: string, authenticated: boolean, presenter: boolean) {
  return destinationAccess(href) === "public" || (authenticated && presenter);
}
