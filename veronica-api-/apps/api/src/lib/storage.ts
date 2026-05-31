import { nanoid } from "nanoid";
import { slugify } from "./slug.js";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const BUCKET = "product-images";

/** Carries an HTTP status so the route can translate to the right response code. */
export class UploadError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

export interface UploadInput {
  name: string;
  type: string;
  data: ArrayBuffer;
}

/**
 * Validate and upload an image to the public `product-images` Supabase bucket.
 *
 * Uses the Storage REST API directly via fetch rather than @supabase/supabase-js:
 * the SDK eagerly initializes a Realtime client that requires native WebSocket
 * (absent on Node < 22) — and a raw fetch is also Cloudflare Workers-ready.
 *
 * Validation runs before any network/config access so bad input fails fast.
 */
export async function uploadImage(file: UploadInput): Promise<{ url: string; key: string }> {
  if (!file.type.startsWith("image/")) {
    throw new UploadError("File must be an image", 400);
  }
  if (file.data.byteLength > MAX_BYTES) {
    throw new UploadError("File exceeds the 5MB limit", 400);
  }

  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) {
    throw new UploadError(
      "Image storage is not configured (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)",
      503,
    );
  }

  const dot = file.name.lastIndexOf(".");
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
  const base = slugify(dot >= 0 ? file.name.slice(0, dot) : file.name) || "image";
  const key = `${nanoid(12)}-${base}${ext}`; // url-safe chars only

  // Service role / secret key is required for write; the anon/publishable key cannot upload.
  const res = await fetch(`${baseUrl}/storage/v1/object/${BUCKET}/${key}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": file.type,
      "x-upsert": "false",
    },
    body: file.data,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string; error?: string };
      detail = body.message ?? body.error ?? detail;
    } catch {
      /* non-JSON error body */
    }
    throw new UploadError(`Upload failed: ${detail}`, 500);
  }

  return { url: `${baseUrl}/storage/v1/object/public/${BUCKET}/${key}`, key };
}
