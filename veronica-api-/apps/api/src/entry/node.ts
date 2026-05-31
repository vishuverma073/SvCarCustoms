import { serve } from "@hono/node-server";
import { createApp } from "../app.js";
import { createDbClient } from "../db/client.js";
import { loadEnv } from "../lib/env.js";

const env = loadEnv();
const db = createDbClient(env.DATABASE_URL);
const app = createApp({ db });

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`veronica-api listening on http://localhost:${info.port}`);
});
