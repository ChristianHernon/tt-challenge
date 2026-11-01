import { hierarchyPaths } from "../../../server/assets-api";

// GET /api/assets/hierarchy — Cloudflare Pages Function.
export const onRequestGet = () => Response.json({ paths: hierarchyPaths });
