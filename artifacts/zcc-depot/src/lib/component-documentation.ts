/** Never turn a missing or untrusted documentation mapping into a clickable link. */
export function componentDocumentation(term: string, resources: Readonly<Record<string, string | undefined>>): string | undefined {
  const value = resources[term];
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return undefined;
    const allowed = (url.hostname === "support.zendesk.com" && url.pathname.startsWith("/hc/en-us/articles/"))
      || url.hostname === "docs.aws.amazon.com";
    return allowed ? url.href : undefined;
  } catch { return undefined; }
}
