// Exports the seeded database as a flat JSON snapshot for the Cloudflare
// Worker in frontend/worker, which can't use node:sqlite.
// Ancestors and hierarchy paths are derived from parentId at runtime, so
// only the joined asset rows are stored. Run after `npm run seed`.
const fs = require("fs");
const path = require("path");
const { dbAll } = require("./database");

const outPath = path.resolve(__dirname, "../frontend/server/assets.json");

const assets = dbAll(`
  SELECT a.id, a.name, a.description, a.friendlyId, a.parentId, a.statusId,
         b.name as status, a.icon, a.classId,
         c.name as className, c.description as classDescription
  FROM assets a
  JOIN asset_statuses b ON a.statusId = b.id
  LEFT JOIN classes c ON a.classId = c.id
  ORDER BY a.id
`).map((row) => ({ ...row }));

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(assets) + "\n");
console.log(
  `Wrote ${assets.length} assets to ${path.relative(process.cwd(), outPath)}`,
);
