import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * On-demand cache invalidation, called by the Express API after admin edits.
 * Requires REVALIDATE_SECRET to be set (same value on API and storefront).
 */
export async function POST(req: Request) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    return NextResponse.json({ ok: false, message: "Not configured" }, { status: 503 });
  }

  let body: { secret?: string; tags?: string[] } = {};
  try {
    body = await req.json();
  } catch {
    // fall through to validation
  }

  if (body.secret !== expected) {
    return NextResponse.json({ ok: false, message: "Invalid secret" }, { status: 401 });
  }

  const allowed = new Set(["homepage-settings", "products", "categories", "site-settings"]);
  const tags = (body.tags ?? []).filter((t) => allowed.has(t));
  tags.forEach((t) => revalidateTag(t, "max"));

  return NextResponse.json({ ok: true, revalidated: tags });
}
