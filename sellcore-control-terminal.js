import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.SELLCORE_CONTROL_PORT || process.env.PORT || 4100);
const DATA_DIR = path.join(__dirname, ".sellcore-control");
const INPUTS_PATH = path.join(DATA_DIR, "terminal-inputs.json");
const QUEUE_PATH = path.join(DATA_DIR, "terminal-queue.json");

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function readJson(filePath, fallback) {
  try {
    ensureDataDir();
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  res.end(body);
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function safeText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function makeRecord(payload, type) {
  const input = safeText(payload.input || payload.command || payload.text);
  if (!input) {
    return null;
  }

  return {
    id: `${type}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    type,
    input,
    label: safeText(payload.label, "untitled"),
    source: safeText(payload.source, "backend-terminal"),
    status: type === "queue" ? "queued" : "saved",
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

async function readPayload(req) {
  const raw = await collectBody(req);
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "OPTIONS") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && url.pathname === "/health") {
      sendJson(res, 200, {
        ok: true,
        service: "sellcore-control-terminal",
        mode: "safe-input-storage",
        port: PORT,
        time: nowIso()
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/terminal/inputs") {
      const inputs = readJson(INPUTS_PATH, []);
      sendJson(res, 200, { ok: true, count: inputs.length, inputs });
      return;
    }

    if (req.method === "POST" && url.pathname === "/terminal/inputs") {
      const payload = await readPayload(req);
      const record = makeRecord(payload, "input");
      if (!record) {
        sendJson(res, 400, { ok: false, error: "Missing input text" });
        return;
      }

      const inputs = readJson(INPUTS_PATH, []);
      const next = [record, ...inputs].slice(0, 100);
      writeJson(INPUTS_PATH, next);
      sendJson(res, 201, { ok: true, record, count: next.length });
      return;
    }

    if (req.method === "DELETE" && url.pathname === "/terminal/inputs") {
      writeJson(INPUTS_PATH, []);
      sendJson(res, 200, { ok: true, count: 0 });
      return;
    }

    if (req.method === "GET" && url.pathname === "/terminal/queue") {
      const queue = readJson(QUEUE_PATH, []);
      sendJson(res, 200, { ok: true, count: queue.length, queue });
      return;
    }

    if (req.method === "POST" && url.pathname === "/terminal/queue") {
      const payload = await readPayload(req);
      const record = makeRecord(payload, "queue");
      if (!record) {
        sendJson(res, 400, { ok: false, error: "Missing queue input text" });
        return;
      }

      const queue = readJson(QUEUE_PATH, []);
      const next = [record, ...queue].slice(0, 100);
      writeJson(QUEUE_PATH, next);
      sendJson(res, 201, { ok: true, record, count: next.length });
      return;
    }

    if (req.method === "DELETE" && url.pathname === "/terminal/queue") {
      writeJson(QUEUE_PATH, []);
      sendJson(res, 200, { ok: true, count: 0 });
      return;
    }

    sendJson(res, 404, {
      ok: false,
      error: "Route not found",
      routes: [
        "GET /health",
        "GET /terminal/inputs",
        "POST /terminal/inputs",
        "DELETE /terminal/inputs",
        "GET /terminal/queue",
        "POST /terminal/queue",
        "DELETE /terminal/queue"
      ]
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown server error"
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`SellCore control terminal listening on http://localhost:${PORT}`);
  console.log("Mode: safe input storage only");
});