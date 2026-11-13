import { DEMO_NUGGETS, type NuggetId } from "@/data/demo-nuggets";

const allowed = new Set<string>(DEMO_NUGGETS.map(nugget => nugget.id));

/** Accept only the prepared catalog, once per nugget, in the supplied order. */
export function validatePlaylist(values: readonly string[]): NuggetId[] {
  return [...new Set(values.filter((id): id is NuggetId => allowed.has(id)))].slice(0, DEMO_NUGGETS.length);
}

export function readPlaylist(search: string) {
  const params = new URLSearchParams(search);
  const entries = params.getAll("playlist");
  const shared = entries.length > 0;
  const values = entries.length === 1 && entries[0].length <= 256 ? entries[0].split(",").filter(Boolean) : [];
  const ids = validatePlaylist(values);
  const invalid = shared && (entries.length !== 1 || entries[0].length > 256 || ids.length !== values.length || ids.length === 0);
  return {
    ids, shared,
    notice: invalid ? "This link contained an empty or invalid playlist. Only recognized, non-duplicate demos were kept. Select demos below to continue." : "",
  };
}

/** Rebuild, never copy incoming query parameters, fragments, or credentials. */
export function playlistUrl(location: string, ids: readonly string[]) {
  const source = new URL(location);
  const url = new URL(source.pathname, source.origin);
  url.searchParams.set("playlist", validatePlaylist(ids).join(","));
  url.hash = "playlist";
  return url.href;
}
