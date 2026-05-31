import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { DbClient } from "../src/db/client.js";

const app = createApp({ db: {} as DbClient });

describe("GET /healthz", () => {
  it("returns 200 with ok status and an ISO timestamp", async () => {
    const res = await app.request("/healthz");
    expect(res.status).toBe(200);

    const body = (await res.json()) as { status: string; timestamp: string; version: string };
    expect(body.status).toBe("ok");
    expect(body.version).toBeTruthy();
    // round-trips cleanly => valid ISO-8601
    expect(body.timestamp).toBe(new Date(body.timestamp).toISOString());
  });

  it("unknown route returns 404 with { error: 'Not Found' }", async () => {
    const res = await app.request("/definitely-not-a-route");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not Found" });
  });
});
