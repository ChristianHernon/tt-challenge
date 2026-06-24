const express = require('express');
const cors = require('cors');
const { dbAll, dbGet } = require('./database');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/api/assets', async (req, res) => {
  const assets = await dbAll('SELECT * FROM assets');
  res.json(assets);
});

app.post('/api/assets/search', async (req, res) => {
  res.status(200).json([]);
});

app.listen(PORT, () => {
    console.log(`Frontend Challenge API Server running on http://localhost:${PORT}`);
});
