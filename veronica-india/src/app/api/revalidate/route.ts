import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

// Bounded so a caller can't submit huge/abusive payloads: max 50 tags, each a
// short slug-ish string.
const RevalidateBodySchema = z.object({
  tags: z.array(z.string().min(1).max(200)).min(1).max(50),
});

/**
 * ISR cache-busting webhook. The backend calls this after a product/category
 * mutation so the storefront's tagged fetches re-fetch within seconds instead
 * of waiting out their `revalidate` window.
 *
 *   POST /api/revalidate
 *   x-revalidate-secret: <REVALIDATE_SECRET>
 *   { "tags": ["products", "product-lavender-sink"] }
 *
 * Tag names mirror the ones set in src/lib/backend.ts:
 *   categories · category-<slug> · category-id-<id>
 *   products   · category-products-<slug> · product-<slug>
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    // Fail closed: without a configured secret we can't authenticate the caller.
    return NextResponse.json({ error: "revalidation_not_configured" }, { status: 503 });
  }
  if (request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = RevalidateBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "tags_required" }, { status: 400 });
  }
  const { tags } = parsed.data;

  // Next 16's Cache Components changed the signature to
  // `revalidateTag(tag, profile)`. `{ expire: 0 }` purges immediately so the
  // next request recomputes (verify against real traffic at integration).
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return NextResponse.json({ revalidated: tags.length, tags, now: Date.now() });
}
