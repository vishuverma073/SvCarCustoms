/** Helpers for the Store Analytics pipeline: classify device + acquisition channel. */

export interface DeviceInfo {
  deviceType: "Mobile" | "Desktop" | "Other";
  os: string;
  browser: string;
}

/** Best-effort device / OS / browser classification from a User-Agent string. */
export function parseDevice(ua: string | null | undefined): DeviceInfo {
  const u = ua ?? "";
  let os = "Other";
  if (/iPhone|iPad|iPod/i.test(u)) os = "iOS";
  else if (/Android/i.test(u)) os = "Android";
  else if (/Windows/i.test(u)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(u)) os = "macOS";
  else if (/Linux|X11/i.test(u)) os = "Linux";

  let browser = "Other";
  if (/Edg\//i.test(u)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(u)) browser = "Opera";
  else if (/Chrome\//i.test(u)) browser = "Chrome";
  else if (/Firefox\//i.test(u)) browser = "Firefox";
  else if (/Safari\//i.test(u)) browser = "Safari";

  const isMobile = /Mobile|Android|iPhone|iPod|Windows Phone/i.test(u) || (os === "iOS" && /iPad/i.test(u) === false);
  const isTablet = /iPad|Tablet/i.test(u);
  const deviceType: DeviceInfo["deviceType"] =
    isMobile || isTablet ? "Mobile" : os === "Windows" || os === "macOS" || os === "Linux" ? "Desktop" : "Other";
  return { deviceType, os, browser };
}

/** Acquisition channel from referrer + utm_source. Unknown/direct → "Others". */
export function channelFrom(referrer?: string | null, utmSource?: string | null): string {
  const hay = `${(utmSource ?? "").toLowerCase()} ${(referrer ?? "").toLowerCase()}`;
  if (/google|googleads|gclid|adwords/.test(hay)) return "Google";
  if (/instagram|\big\b|igsh|instag/.test(hay)) return "Instagram";
  if (/facebook|\bfb\b|fbclid|meta\b/.test(hay)) return "Facebook";
  if (/whatsapp|wa\.me/.test(hay)) return "Whatsapp";
  return "Others";
}
