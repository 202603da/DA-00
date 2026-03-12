import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const app = express();
const PORT = 3000;
const db = new Database("assets.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    type TEXT, -- 'image', 'video', 'audio'
    url TEXT,
    thumbnail TEXT,
    keywords TEXT, -- comma separated
    prompt TEXT,
    format TEXT,
    resolution TEXT,
    tool TEXT,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(express.json());

// Mock data generator
const generateMockData = () => {
  const types = ['image', 'video', 'audio'];
  const keywordsList = ['minimal', 'modern', 'tech', 'clean', 'home', 'appliance', 'future', 'smart', 'white', 'steel'];
  const tools = ['Midjourney', 'DALL-E 3', 'Stable Diffusion', 'Runway Gen-2', 'Suno AI'];
  
  const stmt = db.prepare(`
    INSERT INTO assets (filename, type, url, thumbnail, keywords, prompt, format, resolution, tool, views, likes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 1; i <= 50; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const id = Math.floor(Math.random() * 1000);
    const selectedKeywords = [];
    while (selectedKeywords.length < 3) {
      const k = keywordsList[Math.floor(Math.random() * keywordsList.length)];
      if (!selectedKeywords.includes(k)) selectedKeywords.push(k);
    }
    const keywords = selectedKeywords.join(',');
    
    let url, thumbnail;
    if (type === 'image') {
      url = `https://picsum.photos/seed/${id}/1200/800`;
      thumbnail = `https://picsum.photos/seed/${id}/400/600`;
    } else if (type === 'video') {
      url = `https://www.w3schools.com/html/mov_bbb.mp4`;
      thumbnail = `https://picsum.photos/seed/${id}/400/600`;
    } else {
      url = `https://www.w3schools.com/html/horse.mp3`;
      thumbnail = `https://picsum.photos/seed/${id}/400/400`;
    }

    stmt.run(
      `Asset_${i}.${type === 'audio' ? 'mp3' : type === 'video' ? 'mp4' : 'png'}`,
      type,
      url,
      thumbnail,
      keywords,
      `A high-end ${type} showing a futuristic home appliance with ${keywords.replace(',', ' and ')} aesthetics.`,
      type === 'audio' ? 'MP3' : type === 'video' ? 'MP4' : 'PNG',
      type === 'audio' ? 'N/A' : '3840x2160',
      tools[Math.floor(Math.random() * tools.length)],
      Math.floor(Math.random() * 1000), // views
      Math.floor(Math.random() * 100)   // likes
    );
  }
};

// Check if DB is empty and populate
const count = db.prepare("SELECT COUNT(*) as count FROM assets").get() as { count: number };
if (count.count === 0) {
  generateMockData();
}

// API Routes
app.get("/api/assets", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search as string;

  let query = "SELECT * FROM assets";
  let params: any[] = [];
  let conditions: string[] = [];

  if (search) {
    conditions.push("(filename LIKE ? OR keywords LIKE ? OR prompt LIKE ? OR type LIKE ?)");
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
  }

  if (req.query.type) {
    conditions.push("type = ?");
    params.push(req.query.type);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY RANDOM() LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const assets = db.prepare(query).all(...params);
  res.json(assets);
});

app.get("/api/assets/:id", (req, res) => {
  const asset = db.prepare("SELECT * FROM assets WHERE id = ?").get(req.params.id);
  if (asset) {
    res.json(asset);
  } else {
    res.status(404).json({ error: "Asset not found" });
  }
});

app.get("/api/assets/:id/related", (req, res) => {
  const asset = db.prepare("SELECT keywords FROM assets WHERE id = ?").get(req.params.id) as { keywords: string };
  if (!asset) return res.status(404).json({ error: "Asset not found" });

  const keywords = asset.keywords.split(',');
  const query = `
    SELECT * FROM assets 
    WHERE id != ? AND (${keywords.map(() => "keywords LIKE ?").join(" OR ")})
    LIMIT 10
  `;
  const params = [req.params.id, ...keywords.map(k => `%${k}%`)];
  const related = db.prepare(query).all(...params);
  res.json(related);
});

app.post("/api/assets/:id/view", (req, res) => {
  const result = db.prepare("UPDATE assets SET views = views + 1 WHERE id = ?").run(req.params.id);
  if (result.changes > 0) {
    const asset = db.prepare("SELECT * FROM assets WHERE id = ?").get(req.params.id);
    res.json(asset);
  } else {
    res.status(404).json({ error: "Asset not found" });
  }
});

app.post("/api/assets/:id/like", (req, res) => {
  const result = db.prepare("UPDATE assets SET likes = likes + 1 WHERE id = ?").run(req.params.id);
  if (result.changes > 0) {
    const asset = db.prepare("SELECT * FROM assets WHERE id = ?").get(req.params.id);
    res.json(asset);
  } else {
    res.status(404).json({ error: "Asset not found" });
  }
});

app.post("/api/import", (req, res) => {
  // In a real scenario, we would scan the folder path provided.
  // Here we just simulate it by adding more mock data.
  const { path: folderPath } = req.body;
  console.log(`Importing from: ${folderPath}`);
  generateMockData();
  res.json({ message: "Import successful", path: folderPath });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
