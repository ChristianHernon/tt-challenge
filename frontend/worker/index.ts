import {
  hierarchyPaths,
  searchAssets,
  type SearchBody,
} from "../server/assets-api";

// Cloudflare Worker entry. Static files in ./dist are served by Workers
// static assets; only /api/* reaches this script (run_worker_first in
// wrangler.jsonc).
const search = async (request: Request) => {
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

export default {
  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    const { method } = request;

    if (pathname === "/api/assets/search" && method === "POST") {
      return search(request);
    }
    if (pathname === "/api/assets/hierarchy" && method === "GET") {
      return Response.json({ paths: hierarchyPaths });
    }
    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
