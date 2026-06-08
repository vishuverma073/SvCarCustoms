/**
 * Bootstrap an admin user.
 *
 *   pnpm admin:create -- --phone "+91..." --email "a@b.com" --name "Name" --password "..."
 *
 * Refuses to run against a non-dev database. Never echoes the password.
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import bcrypt from "bcryptjs";
import { loadEnv } from "../src/lib/env.js";
import { users } from "../src/db/schema.js";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

// ─── Safety guard (per agent council) ────────────────────────
const dbUrl = process.env.DATABASE_URL ?? "";
if (!dbUrl.includes("-dev") && process.env.I_AM_SURE_NOT_PROD !== "true") {
  console.error(
    "✗ Refusing to create an admin: DATABASE_URL is not a dev database and I_AM_SURE_NOT_PROD !== 'true'.",
  );
  process.exit(1);
}

async function main() {
  const phone = arg("phone");
  const email = arg("email");
  const name = arg("name") ?? null;
  const password = arg("password");

  if (!phone || !email || !password) {
    console.error(
      "Usage: tsx scripts/create-admin.ts --phone <phone> --email <email> --name <name> --password <password>",
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("✗ Password must be at least 8 characters.");
    process.exit(1);
  }

  const env = loadEnv();
  const sql = postgres(env.DATABASE_URL, { prepare: false });
  const db = drizzle(sql);
  try {
    // 10 rounds (not 12): Cloudflare Workers has a ~50ms CPU budget per request
    // and 12 rounds costs 200-280ms. Keep in sync with the login route.
    const passwordHash = bcrypt.hashSync(password, 10);
    const [row] = await db
      .insert(users)
      .values({ phone, email, name, isAdmin: true, passwordHash })
      .onConflictDoUpdate({
        target: users.phone,
        set: { email, name, isAdmin: true, passwordHash },
      })
      .returning({ id: users.id, email: users.email });
    console.log(`✓ Admin created: ${row!.email} (id ${row!.id})`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("✗ create-admin failed:", err);
  process.exit(1);
});
