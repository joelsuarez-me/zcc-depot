import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import ipaddr from "ipaddr.js";

export function publicUrl(value: string): URL {
  const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      (url.port && !["80", "443"].includes(url.port)) ||
      !host.includes(".") || /(^|\.)(localhost|local|internal|test|invalid)$/i.test(host) ||
      (ipaddr.isValid(host) && !isPublicAddress(host))) {
    throw new Error("Use a public company website with no credentials or custom port.");
  }
  return url;
}

export function isPublicAddress(address: string): boolean {
  try { return ipaddr.process(address).range() === "unicast"; } catch { return false; }
}

/** Validate every redirect and pin the checked DNS result to the actual socket. */
export async function fetchPublic(
  value: string, signal: AbortSignal, maxBytes = 2_000_000, redirects = 0, redirectTargetOnly = false,
): Promise<{ bytes: Buffer; url: string; contentType: string }> {
  if (redirects > 4) throw new Error("Too many website redirects.");
  signal.throwIfAborted();
  const url = publicUrl(value);
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(record => !isPublicAddress(record.address))) {
    throw new Error("The website must resolve only to public addresses.");
  }
  const address = addresses.find(record => record.family === 4) ?? addresses[0];
  return new Promise((resolve, reject) => {
    const send = url.protocol === "https:" ? httpsRequest : httpRequest;
    const req = send(url, {
      signal, timeout: 12_000, maxHeaderSize: 16_384,
      // A new connection prevents reusing a socket resolved for an unchecked host.
      agent: false, family: address.family,
      lookup: (_host, _options, callback) => callback(null, address.address, address.family),
      headers: { "User-Agent": "ZCC-Depot-Research/1.0", Accept: "text/html,image/*;q=0.9,*/*;q=0.5", "Accept-Encoding": "identity" },
    }, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        try {
          const target = publicUrl(new URL(res.headers.location, url).href).href;
          if (redirectTargetOnly) { resolve({ bytes: Buffer.alloc(0), url: target, contentType: "" }); return; }
          fetchPublic(target, signal, maxBytes, redirects + 1).then(resolve, reject);
        } catch (error) { reject(error); }
        return;
      }
      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        res.resume(); reject(new Error("The public website could not be retrieved.")); return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > maxBytes) { req.destroy(new Error("Website response exceeded the size limit.")); return; }
        chunks.push(chunk);
      });
      res.on("end", () => resolve({ bytes: Buffer.concat(chunks), url: url.href, contentType: res.headers["content-type"] ?? "" }));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("Website lookup timed out.")));
    req.on("error", reject);
    req.end();
  });
}
