const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "site.json");

if (!ADMIN_PASSWORD || !SESSION_SECRET) {
  console.error("Set ADMIN_PASSWORD and SESSION_SECRET environment variables before starting.");
  process.exit(1);
}
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    notes: [{ id: "welcome", title: "", body: "Welcome to NOTES.\n\nA quiet place for words.", updatedAt: new Date().toISOString() }],
    musicUrl: ""
  }, null, 2));
}

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return { notes: [], musicUrl: "" }; }
}
function writeData(data) {
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      mediaSrc: ["'self'", "https:", "http:"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(express.json({ limit: "1mb" }));
app.use(session({
  name: "notes_admin",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));
app.use(express.static(path.join(__dirname, "public")));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const requireAdmin = (req, res, next) => req.session && req.session.isAdmin
  ? next() : res.status(401).json({ error: "Please unlock editing first." });

app.get("/api/site", (req, res) => {
  const data = readData();
  res.json({ notes: data.notes, musicUrl: data.musicUrl || "", isAdmin: !!req.session.isAdmin });
});
app.post("/api/login", loginLimiter, (req, res) => {
  const password = String(req.body.password || "");
  if (password.length > 300 || password !== ADMIN_PASSWORD) return res.status(403).json({ error: "Incorrect password." });
  req.session.isAdmin = true;
  res.json({ ok: true });
});
app.post("/api/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});
app.put("/api/notes", requireAdmin, (req, res) => {
  if (!Array.isArray(req.body.notes) || req.body.notes.length > 100) return res.status(400).json({ error: "Invalid notes." });
  const notes = req.body.notes.map((n, i) => ({
    id: String(n.id || `note-${i}`).slice(0, 80),
    title: String(n.title || "").slice(0, 160),
    body: String(n.body || "").slice(0, 30000),
    updatedAt: new Date().toISOString()
  }));
  const data = readData();
  data.notes = notes;
  writeData(data);
  res.json({ ok: true, notes });
});
app.put("/api/music", requireAdmin, (req, res) => {
  const url = String(req.body.url || "").trim();
  if (url && !/^https?:\/\/\S+$/i.test(url)) return res.status(400).json({ error: "Use a direct http(s) audio URL." });
  const data = readData();
  data.musicUrl = url.slice(0, 2000);
  writeData(data);
  res.json({ ok: true, musicUrl: data.musicUrl });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`NOTES is running on port ${PORT}`));
