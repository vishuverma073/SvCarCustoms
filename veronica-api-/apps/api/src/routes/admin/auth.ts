import { Hono } from "hono";
import { and, eq, isNotNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { AdminLoginRequestSchema } from "@veronica/contracts";
import type { DbClient } from "../../db/client.js";
import { users } from "../../db/schema.js";
import { signAdminAccess } from "../../lib/jwt.js";
import { logAudit } from "../../lib/audit.js";
import type { AppEnv } from "../../lib/types.js";

// A valid-format hash compared against when no user matches, so response timing
// doesn't leak whether the email exists.
const DUMMY_HASH = bcrypt.hashSync("veronica-no-such-user-placeholder", 10);

export function makeAdminAuthRouter(db: DbClient) {
  const router = new Hono<AppEnv>();

  router.post("/login", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = AdminLoginRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Invalid request", issues: parsed.error.flatten() }, 400);
    }
    const { email, password } = parsed.data;

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.isAdmin, true), isNotNull(users.passwordHash)))
      .limit(1);

    // Always run a compare (constant-ish time); return one generic 401 either way
    // so we don't distinguish "no such user" from "wrong password".
    const ok = bcrypt.compareSync(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const accessToken = await signAdminAccess({ sub: user.id });

    await logAudit(db, {
      actorUserId: user.id,
      action: "admin.login.success",
      resourceType: "user",
      resourceId: user.id,
    });

    return c.json({
      accessToken,
      admin: { id: user.id, email: user.email!, name: user.name, isAdmin: true as const },
    });
  });

  return router;
}
