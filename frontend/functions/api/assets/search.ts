import { searchAssets, type SearchBody } from "../../../server/assets-api";

// POST /api/assets/search — Cloudflare Pages Function.
export const onRequestPost = async ({ request }: { request: Request }) => {
  let body: SearchBody;
  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (body === null || typeof body !== "object") body = {};
  return Response.json(searchAssets(body));
};
