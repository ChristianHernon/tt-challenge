const express = require("express");
const cors = require("cors");
const { dbAll, dbGet } = require("./database");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/api/assets", async (req, res) => {
  const assets = await dbAll("SELECT * FROM assets");
  res.json(assets);
});

app.get("/api/assets/icons", async (req, res) => {
  const icons = await dbAll("SELECT DISTINCT icon FROM assets");
  res.json(icons);
});

app.post("/api/assets/search", async (req, res) => {
  if (Object.keys(req.body ?? {}).length === 0) {
    return res
      .status(400)
      .json({ error: "Please provide at least one filter" });
  }

  const params = [];
  let query = "SELECT * FROM assets WHERE 1=1";

  if (req.body.name) {
    query += " AND name LIKE ?";

    if (req.body.name.startsWith("*")) {
      params.push(req.body.name.replace(/^\*/, '%'));
    } else if (req.body.name.endsWith("*")) {
      params.push(req.body.name.replace(/\*$/, '%'));
    } else params.push(`%${req.body.name}%`);
  }

  if (req.body.parentId) {
    query += " AND parentId = ?";
    params.push(req.body.parentId);
  }

  if (req.body.statusId) {
    query += " AND statusId = ?";
    params.push(req.body.statusId);
  }

  if (req.body.classId) {
    query += " AND classId = ?";
    params.push(req.body.classId);
  }

  const assets = await dbAll(query, params);
  res.status(200).json({ count: assets.length, assets });
});

app.listen(PORT, () => {
  console.log(
    `Frontend Challenge API Server running on http://localhost:${PORT}`,
  );
});
