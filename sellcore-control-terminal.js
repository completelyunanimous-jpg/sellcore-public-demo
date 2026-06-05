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
const EXPANSIONS_PATH = path.join(DATA_DIR, "terminal-expansions.json");

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


function chooseExpansionCategory(input) {
  const text = input.toLowerCase();

  if (text.includes("frontend") || text.includes("interface") || text.includes("css") || text.includes("app.jsx") || text.includes("panel") || text.includes("ui")) {
    return "frontend-edit";
  }

  if (text.includes("backend") || text.includes("server") || text.includes("route") || text.includes("api") || text.includes("terminal") || text.includes("control")) {
    return "backend-control";
  }

  if (text.includes("build") || text.includes("test") || text.includes("verify") || text.includes("snapshot") || text.includes("check")) {
    return "verification";
  }

  if (text.includes("deploy") || text.includes("github") || text.includes("push") || text.includes("pages")) {
    return "deployment";
  }

  return "general-control";
}

function chooseRiskLevel(input) {
  const text = input.toLowerCase();

  if (text.includes("execute") || text.includes("delete") || text.includes("reset") || text.includes("force") || text.includes("shell") || text.includes("crypto")) {
    return "high";
  }

  if (text.includes("edit") || text.includes("connect") || text.includes("patch") || text.includes("route") || text.includes("backend") || text.includes("frontend")) {
    return "medium";
  }

  return "low";
}

function buildExpansionSteps(category) {
  if (category === "frontend-edit") {
    return [
      "Inspect frontend anchors before editing",
      "Patch only the confirmed JSX or CSS section",
      "Protect bottom navigation and Core Control behavior",
      "Run npm run build",
      "Commit only after build passes"
    ];
  }

  if (category === "backend-control") {
    return [
      "Inspect backend control terminal routes",
      "Add or update safe storage routes only",
      "Avoid shell execution",
      "Run npm run control:check",
      "Run npm run build",
      "Commit only after checks pass"
    ];
  }

  if (category === "verification") {
    return [
      "Run git status and git log checks",
      "Run npm run control:check if backend files changed",
      "Run npm run build",
      "Create a protected snapshot if requested",
      "Record the verified commit and output"
    ];
  }

  if (category === "deployment") {
    return [
      "Confirm local build passes",
      "Confirm git status is clean",
      "Push only verified commits",
      "Check remote head after push",
      "Do not force push unless explicitly approved"
    ];
  }

  return [
    "Inspect current repository state",
    "Find exact anchors before editing",
    "Apply the smallest safe patch",
    "Run syntax or build verification",
    "Commit only after verification passes"
  ];
}

function buildExpansionGates(category, riskLevel) {
  const gates = [
    "No broad App.jsx replacement",
    "ASCII only in source code",
    "Build or syntax check before commit",
    "No shell execution from saved inputs"
  ];

  if (riskLevel === "high") {
    gates.push("Require manual approval before implementation");
  }

  if (category === "frontend-edit") {
    gates.push("Bottom navigation must remain protected");
  }

  if (category === "backend-control") {
    gates.push("Backend routes must remain safe storage only");
  }

  return gates;
}

function expandRecord(record) {
  const input = safeText(record.input);
  const category = chooseExpansionCategory(input);
  const riskLevel = chooseRiskLevel(input);

  return {
    id: `expansion-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    sourceRecordId: record.id || null,
    sourceType: record.type || "unknown",
    label: record.label || "untitled",
    originalInput: input,
    category,
    riskLevel,
    status: riskLevel === "high" ? "needs-review" : "expanded",
    goal: input,
    steps: buildExpansionSteps(category),
    gates: buildExpansionGates(category, riskLevel),
    suggestedNextAction: `Inspect and prepare a safe ${category} patch`,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

function readExpansionSources(payload) {
  const source = safeText(payload.source, "queue");
  const limit = Math.max(1, Math.min(Number(payload.limit || 5), 25));

  if (source === "inputs") {
    return readJson(INPUTS_PATH, []).slice(0, limit);
  }

  if (source === "all") {
    return [...readJson(QUEUE_PATH, []), ...readJson(INPUTS_PATH, [])].slice(0, limit);
  }

  return readJson(QUEUE_PATH, []).slice(0, limit);
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


    if (req.method === "GET" && url.pathname === "/terminal/expansions") {
      const expansions = readJson(EXPANSIONS_PATH, []);
      sendJson(res, 200, { ok: true, count: expansions.length, expansions });
      return;
    }

    if (req.method === "POST" && url.pathname === "/terminal/expand") {
      const payload = await readPayload(req);
      const records = readExpansionSources(payload);

      if (records.length === 0) {
        sendJson(res, 404, { ok: false, error: "No source records found to expand" });
        return;
      }

      const created = records.map((record) => expandRecord(record));
      const expansions = readJson(EXPANSIONS_PATH, []);
      const next = [...created, ...expansions].slice(0, 100);
      writeJson(EXPANSIONS_PATH, next);

      sendJson(res, 201, {
        ok: true,
        count: next.length,
        createdCount: created.length,
        created
      });
      return;
    }

    if (req.method === "DELETE" && url.pathname === "/terminal/expansions") {
      writeJson(EXPANSIONS_PATH, []);
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
        "DELETE /terminal/queue",
        "GET /terminal/expansions",
        "POST /terminal/expand",
        "DELETE /terminal/expansions"
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