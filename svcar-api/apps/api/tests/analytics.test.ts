import { describe, it, expect } from "vitest";
import { parseDevice, channelFrom } from "../src/lib/analytics.js";

describe("parseDevice", () => {
  it("detects iPhone as Mobile/iOS", () => {
    const d = parseDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605 Safari/604");
    expect(d.deviceType).toBe("Mobile");
    expect(d.os).toBe("iOS");
    expect(d.browser).toBe("Safari");
  });
  it("detects Android Chrome as Mobile/Android/Chrome", () => {
    const d = parseDevice("Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit Chrome/120 Mobile Safari");
    expect(d.deviceType).toBe("Mobile");
    expect(d.os).toBe("Android");
    expect(d.browser).toBe("Chrome");
  });
  it("detects Windows desktop", () => {
    const d = parseDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit Chrome/120 Safari");
    expect(d.deviceType).toBe("Desktop");
    expect(d.os).toBe("Windows");
  });
  it("detects macOS desktop", () => {
    const d = parseDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit Safari/605");
    expect(d.deviceType).toBe("Desktop");
    expect(d.os).toBe("macOS");
  });
  it("handles empty UA", () => {
    expect(parseDevice("").deviceType).toBe("Other");
    expect(parseDevice(null).os).toBe("Other");
  });
});

describe("channelFrom", () => {
  it("classifies Google", () => {
    expect(channelFrom("https://www.google.com/", null)).toBe("Google");
    expect(channelFrom(null, "google")).toBe("Google");
  });
  it("classifies Instagram", () => expect(channelFrom("https://l.instagram.com/", null)).toBe("Instagram"));
  it("classifies Facebook", () => expect(channelFrom(null, "facebook")).toBe("Facebook"));
  it("classifies Whatsapp", () => expect(channelFrom("https://wa.me/919000000000", null)).toBe("Whatsapp"));
  it("unknown / direct falls back to Others", () => {
    expect(channelFrom(null, null)).toBe("Others");
    expect(channelFrom("https://some-blog.example/", null)).toBe("Others");
  });
});
