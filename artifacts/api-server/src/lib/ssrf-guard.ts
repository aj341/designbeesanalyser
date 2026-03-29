import { promises as dns } from "dns";
import net from "net";

function extractIPv4FromMappedIPv6(ip: string): string | null {
  const match = ip.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  return match ? match[1] : null;
}

export function isPrivateIP(ip: string): boolean {
  const mapped = extractIPv4FromMappedIPv6(ip);
  if (mapped) return isPrivateIP(mapped);

  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  if (net.isIPv6(ip)) {
    const n = ip.toLowerCase();
    return (
      n === "::1" ||
      n === "::" ||
      n.startsWith("fc") ||
      n.startsWith("fd") ||
      n.startsWith("fe80:") ||
      n.startsWith("::ffff:0:") ||
      n === "0:0:0:0:0:0:0:0" ||
      n === "0:0:0:0:0:0:0:1"
    );
  }

  return true;
}

const BLOCKED_HOSTNAMES = new Set(["localhost", "broadcasthost"]);

export function hostnameAppearsPrivate(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(h)) return true;
  if (h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".localhost")) return true;
  if (net.isIP(h)) return isPrivateIP(h);
  return false;
}

async function resolveHostname(hostname: string): Promise<string[]> {
  let resolved4: string[] = [];
  let resolved6: string[] = [];

  try {
    resolved4 = await dns.resolve4(hostname);
  } catch {
    // No A records
  }
  try {
    resolved6 = await dns.resolve6(hostname);
  } catch {
    // No AAAA records
  }

  return [...resolved4, ...resolved6];
}

export async function assertSsrfSafe(url: string): Promise<{ pinnableIp: string | null }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (hostnameAppearsPrivate(hostname)) {
    throw new Error("URL resolves to a disallowed address");
  }

  if (net.isIP(hostname)) {
    return { pinnableIp: null };
  }

  const all = await resolveHostname(hostname);

  if (all.length === 0) {
    throw new Error("Could not resolve hostname");
  }

  for (const ip of all) {
    if (isPrivateIP(ip)) {
      throw new Error("URL resolves to a disallowed address");
    }
  }

  const pinnableIp = all.find((ip) => net.isIPv4(ip)) ?? all[0];
  return { pinnableIp };
}

// Cache hostname safety checks to avoid repeated DNS lookups for CDN/external resources.
// Values: true = safe, false = blocked. Persists for process lifetime.
const hostnameCache = new Map<string, boolean>();

export async function assertUrlSsrfSafeAsync(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (hostnameAppearsPrivate(hostname)) {
    throw new Error("URL resolves to a disallowed address");
  }

  if (net.isIP(hostname)) {
    return;
  }

  // Return cached result immediately — avoids DNS lookups on every CDN image/font request
  const cached = hostnameCache.get(hostname);
  if (cached === true) return;
  if (cached === false) throw new Error("URL resolves to a disallowed address");

  const all = await resolveHostname(hostname);

  if (all.length === 0) {
    hostnameCache.set(hostname, false);
    throw new Error("Could not resolve hostname");
  }

  for (const ip of all) {
    if (isPrivateIP(ip)) {
      hostnameCache.set(hostname, false);
      throw new Error("URL resolves to a disallowed address");
    }
  }

  hostnameCache.set(hostname, true);
}
