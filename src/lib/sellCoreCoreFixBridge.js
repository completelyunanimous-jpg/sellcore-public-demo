const BRIDGE_RECORDS_KEY = "sellcore:corefix:bridge-records";
const COREFIX_ENTRIES_KEY = "sellcore:corefix:entries";
const COREFIX_CARDS_KEY = "sellcore:corefix:cards";
const LATEST_KEY = "sellcore:corefix:latest";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function readArray(key) {
  return safeJsonParse(localStorage.getItem(key), []);
}

function writeArray(key, value, limit = 250) {
  localStorage.setItem(key, JSON.stringify(value.slice(0, limit)));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function classifyBridgeIssue(text, category) {
  const lower = String(text || "").toLowerCase();

  if (lower.includes("listing") || lower.includes("corecard") || lower.includes("seller") || category === "SellCore Listing") {
    return {
      likelyCause: "Marketplace listing, CoreCard, seller flow, or trust-display issue.",
      sampleFix: "Check listing creation, saved item structure, CoreCard fields, and whether the feed/detail view receives the expected data.",
      nextStep: "Create one test listing, inspect the saved object, then turn the broken behavior into a CoreFix card.",
      fullFixDirection: "Trace the listing from creation → saved state → feed render → detail view, then repair the first broken contract."
    };
  }

  if (lower.includes("organizer") || lower.includes("cao") || category === "Core Organizer") {
    return {
      likelyCause: "Core Organizer, CAO action, localStorage count, or dashboard control issue.",
      sampleFix: "Run a CAO quantity scan, verify localStorage keys, then test lock/reset/move actions one at a time.",
      nextStep: "Export organizer JSON and save the failure as a CoreFix diagnostic.",
      fullFixDirection: "Verify CAO button state, dashboard actions, storage records, and event bridge behavior before patching."
    };
  }

  if (lower.includes("button") || lower.includes("click") || lower.includes("input") || category === "UI Interaction") {
    return {
      likelyCause: "UI event listener, pointer layer, z-index, or panel injection issue.",
      sampleFix: "Confirm the element appears, inspect whether pointer events are blocked, then bind direct onclick handlers if needed.",
      nextStep: "Test the smallest failing control before rebuilding the whole panel.",
      fullFixDirection: "Repair the interaction layer using direct event binding, clear z-index conflicts, and preserve mobile-safe layout."
    };
  }

  if (lower.includes("product") || lower.includes("pack") || lower.includes("export") || category === "CoreFix Product") {
    return {
      likelyCause: "CoreFix card, product-pack export, JSON download, or saved-card flow issue.",
      sampleFix: "Generate a diagnostic, save a card, confirm card count increases, then export one card before exporting the full pack.",
      nextStep: "Use the exported JSON as the first product-pack test file.",
      fullFixDirection: "Validate diagnostic creation, card conversion, product-pack generation, and file export in sequence."
    };
  }

  return {
    likelyCause: "SellCore/CoreFix bridge issue or general workflow break.",
    sampleFix: "Identify which layer created the issue, then send it through the bridge as a CoreFix diagnostic.",
    nextStep: "Use the bridge panel to create a reusable repair card.",
    fullFixDirection: "Capture the issue source, category, symptom, and desired fix, then generate a CoreFix card for reuse."
  };
}

function createBridgeDiagnostic(source, category, issue) {
  const diagnosis = classifyBridgeIssue(issue, category);

  return {
    id: `corefix-bridge-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    source,
    category,
    problem: issue,
    diagnosis,
    status: "bridge_diagnostic",
    bridge: "SellCore → CoreFix",
    productLane: "SellCore issue → CoreFix diagnostic → reusable card → product pack"
  };
}

function createProductCardFromBridge(diagnostic) {
  return {
    cardId: `corefix-bridge-card-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sourceDiagnosticId: diagnostic.id,
    createdAt: new Date().toISOString(),
    savedAt: new Date().toISOString(),
    title: `${diagnostic.category} Bridge Fix Card`,
    tier: "bridge_fix",
    tierLabel: "SellCore Bridge Fix",
    category: diagnostic.category,
    problem: diagnostic.problem,
    likelyCause: diagnostic.diagnosis?.likelyCause || "",
    sampleFix: diagnostic.diagnosis?.sampleFix || "",
    nextStep: diagnostic.diagnosis?.nextStep || "",
    fullFixDirection: diagnostic.diagnosis?.fullFixDirection || "",
    productUse: "Reusable bridge card created from SellCore/Core Organizer/CoreFix workflow issue.",
    source: diagnostic.source,
    bridge: diagnostic.bridge,
    status: "saved_bridge_corefix_card"
  };
}

function renderBridgeRecords(records) {
  if (!records.length) {
    return `<div style="font-size:12px; opacity:0.62;">No bridge records yet.</div>`;
  }

  return records.slice(0, 6).map((record) => `
    <div style="border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:10px; background:rgba(255,255,255,0.045);">
      <div style="font-size:11px; opacity:0.62;">${new Date(record.createdAt).toLocaleString()}</div>
      <div style="font-size:13px; font-weight:950;">${escapeHtml(record.category)}</div>
      <div style="font-size:11px; opacity:0.65; margin-top:2px;">${escapeHtml(record.source)}</div>
      <div style="margin-top:8px; font-size:12px; opacity:0.82; line-height:1.4;">${escapeHtml(record.problem).slice(0, 180)}</div>
    </div>
  `).join("");
}

function buildBridgePanel() {
  document.getElementById("sellcore-corefix-bridge-panel")?.remove();

  const records = readArray(BRIDGE_RECORDS_KEY);
  const entries = readArray(COREFIX_ENTRIES_KEY);
  const cards = readArray(COREFIX_CARDS_KEY);

  const panel = document.createElement("div");
  panel.id = "sellcore-corefix-bridge-panel";
  panel.style.position = "fixed";
  panel.style.right = "12px";
  panel.style.top = "170px";
  panel.style.width = "min(430px, calc(100vw - 24px))";
  panel.style.maxHeight = "calc(100vh - 122px)";
  panel.style.overflow = "auto";
  panel.style.zIndex = "999995";
  panel.style.border = "1px solid rgba(255,255,255,0.18)";
  panel.style.borderRadius = "22px";
  panel.style.padding = "14px";
  panel.style.background = "rgba(5, 12, 28, 0.97)";
  panel.style.backdropFilter = "blur(16px)";
  panel.style.color = "white";
  panel.style.fontFamily = "Arial, sans-serif";
  panel.style.boxShadow = "0 20px 70px rgba(0,0,0,0.48)";
  panel.style.pointerEvents = "auto";

  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
      <div>
        <div style="font-size:12px; letter-spacing:0.14em; opacity:0.7;">BLOCK 018</div>
        <div style="font-size:18px; font-weight:900;">SellCore ↔ CoreFix Bridge</div>
        <div style="font-size:12px; opacity:0.62; margin-top:2px;">Marketplace issue → CoreFix card</div>
      </div>
      <button type="button" id="sellcore-bridge-close" style="border:0; border-radius:999px; padding:7px 11px; background:white; color:#06101f; font-weight:900;">X</button>
    </div>

    <div style="margin-top:12px; font-size:13px; opacity:0.82; line-height:1.45;">
      Send SellCore problems, Core Organizer records, UI failures, product-pack ideas, or listing/business issues into CoreFix as reusable diagnostic cards.
    </div>

    <div style="margin-top:14px; display:grid; gap:8px;">
      <select id="sellcore-bridge-source" style="width:100%; border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:11px; background:#07111f; color:white; font-weight:800;">
        <option value="SellCore Public Demo">SellCore Public Demo</option>
        <option value="Core Organizer / CAO">Core Organizer / CAO</option>
        <option value="CoreFix">CoreFix</option>
        <option value="Marketplace Flow">Marketplace Flow</option>
        <option value="Future CellCore Hub">Future CellCore Hub</option>
      </select>

      <select id="sellcore-bridge-category" style="width:100%; border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:11px; background:#07111f; color:white; font-weight:800;">
        <option value="SellCore Listing">SellCore Listing</option>
        <option value="Core Organizer">Core Organizer</option>
        <option value="UI Interaction">UI Interaction</option>
        <option value="CoreFix Product">CoreFix Product</option>
        <option value="General Bridge">General Bridge</option>
      </select>

      <textarea id="sellcore-bridge-issue" placeholder="Describe the SellCore/CoreFix issue or product opportunity..." style="width:100%; min-height:108px; resize:vertical; border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:11px; background:rgba(255,255,255,0.055); color:white; font-family:Arial, sans-serif; box-sizing:border-box;"></textarea>

      <button type="button" id="sellcore-bridge-create" style="width:100%; border:0; border-radius:14px; padding:12px; background:#f3c75f; color:#07101d; font-weight:950;">
        Send Issue to CoreFix
      </button>

      <button type="button" id="sellcore-bridge-save-card" style="width:100%; border:1px solid rgba(125,227,255,0.35); border-radius:14px; padding:12px; background:rgba(125,227,255,0.07); color:white; font-weight:950;">
        Save Latest Bridge Diagnostic as CoreFix Card
      </button>

      <button type="button" id="sellcore-bridge-quick-ui" style="width:100%; border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:11px; background:rgba(255,255,255,0.045); color:white; font-weight:850;">
        Quick Card: Button / Input Not Working
      </button>
    </div>

    <div id="sellcore-bridge-output" style="margin-top:14px;"></div>

    <div style="margin-top:16px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
      <div style="border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:10px; background:rgba(255,255,255,0.05);">
        <div style="font-size:11px; opacity:0.64;">Bridge</div>
        <div style="font-size:18px; font-weight:900; margin-top:3px;">${records.length}</div>
      </div>
      <div style="border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:10px; background:rgba(255,255,255,0.05);">
        <div style="font-size:11px; opacity:0.64;">CoreFix</div>
        <div style="font-size:18px; font-weight:900; margin-top:3px;">${entries.length}</div>
      </div>
      <div style="border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:10px; background:rgba(255,255,255,0.05);">
        <div style="font-size:11px; opacity:0.64;">Cards</div>
        <div style="font-size:18px; font-weight:900; margin-top:3px;">${cards.length}</div>
      </div>
    </div>

    <div style="margin-top:16px;">
      <div style="font-size:12px; letter-spacing:0.14em; opacity:0.7; margin-bottom:8px;">RECENT BRIDGE RECORDS</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${renderBridgeRecords(records)}
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  const output = document.getElementById("sellcore-bridge-output");

  document.getElementById("sellcore-bridge-close").onclick = () => panel.remove();

  function createFromFields() {
    const source = document.getElementById("sellcore-bridge-source")?.value || "SellCore Public Demo";
    const category = document.getElementById("sellcore-bridge-category")?.value || "General Bridge";
    const issue = document.getElementById("sellcore-bridge-issue")?.value || "";

    if (!issue.trim()) {
      output.innerHTML = `
        <div style="border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:10px; background:rgba(255,255,255,0.045); font-size:13px;">
          Add an issue first. The bridge needs a symptom, product idea, or workflow problem.
        </div>
      `;
      return null;
    }

    const diagnostic = createBridgeDiagnostic(source, category, issue);
    const bridgeRecords = readArray(BRIDGE_RECORDS_KEY);
    const coreFixEntries = readArray(COREFIX_ENTRIES_KEY);

    writeArray(BRIDGE_RECORDS_KEY, [diagnostic, ...bridgeRecords], 250);
    writeArray(COREFIX_ENTRIES_KEY, [diagnostic, ...coreFixEntries], 250);
    localStorage.setItem(LATEST_KEY, JSON.stringify(diagnostic));

    output.innerHTML = `
      <div style="border:1px solid rgba(243,199,95,0.35); border-radius:16px; padding:12px; background:rgba(243,199,95,0.08);">
        <div style="font-size:12px; opacity:0.72;">BRIDGE DIAGNOSTIC CREATED</div>
        <div style="margin-top:8px; font-size:13px; line-height:1.5;"><strong>Likely Cause:</strong> ${escapeHtml(diagnostic.diagnosis.likelyCause)}</div>
        <div style="margin-top:8px; font-size:13px; line-height:1.5;"><strong>Sample Fix:</strong> ${escapeHtml(diagnostic.diagnosis.sampleFix)}</div>
        <div style="margin-top:8px; font-size:13px; line-height:1.5;"><strong>Next Step:</strong> ${escapeHtml(diagnostic.diagnosis.nextStep)}</div>
        <div style="margin-top:8px; font-size:13px; line-height:1.5;"><strong>Full Fix Direction:</strong> ${escapeHtml(diagnostic.diagnosis.fullFixDirection)}</div>
      </div>
    `;

    return diagnostic;
  }

  document.getElementById("sellcore-bridge-create").onclick = () => {
    createFromFields();
  };

  document.getElementById("sellcore-bridge-save-card").onclick = () => {
    const latest = safeJsonParse(localStorage.getItem(LATEST_KEY), null);

    if (!latest) {
      output.innerHTML = `
        <div style="border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:10px; background:rgba(255,255,255,0.045); font-size:13px;">
          Create a bridge diagnostic first, then save it as a CoreFix bridge card.
        </div>
      `;
      return;
    }

    const card = createProductCardFromBridge(latest);
    const cards = readArray(COREFIX_CARDS_KEY);

    writeArray(COREFIX_CARDS_KEY, [card, ...cards], 300);

    output.innerHTML = `
      <div style="border:1px solid rgba(95,243,176,0.35); border-radius:16px; padding:12px; background:rgba(95,243,176,0.08); font-size:13px; line-height:1.5;">
        Bridge card saved to CoreFix. Open CoreFix to export it as a single card or product-pack item.
      </div>
    `;

    setTimeout(buildBridgePanel, 500);
  };

  document.getElementById("sellcore-bridge-quick-ui").onclick = () => {
    document.getElementById("sellcore-bridge-source").value = "SellCore Public Demo";
    document.getElementById("sellcore-bridge-category").value = "UI Interaction";
    document.getElementById("sellcore-bridge-issue").value = "A button, input, selector, or panel control appears visually but does not respond when clicked or typed into. Need to diagnose event binding, z-index, pointer events, or panel rebuild behavior.";
    createFromFields();
  };
}

function buildBridgeButton() {
  if (document.getElementById("sellcore-corefix-bridge-button")) return;

  const button = document.createElement("button");
  button.id = "sellcore-corefix-bridge-button";
  button.type = "button";
  button.textContent = "Bridge";
  button.title = "SellCore to CoreFix Bridge";
  button.style.position = "fixed";
  button.style.left = "12px";
  button.style.top = "198px";
  button.style.zIndex = "999995";
  button.style.border = "0";
  button.style.borderRadius = "999px";
  button.style.padding = "11px 13px";
  button.style.background = "#f3c75f";
  button.style.color = "#07101d";
  button.style.fontWeight = "950";
  button.style.boxShadow = "0 12px 35px rgba(0,0,0,0.3)";
  button.style.pointerEvents = "auto";

  button.onclick = () => {
    buildBridgePanel();
  };

  document.body.appendChild(button);
}

export function installSellCoreCoreFixBridge() {
  try {
    if (!localStorage.getItem(BRIDGE_RECORDS_KEY)) {
      localStorage.setItem(BRIDGE_RECORDS_KEY, JSON.stringify([]));
    }

    buildBridgeButton();
    console.info("[SellCore Block 018] SellCore to CoreFix Bridge installed.");
  } catch (error) {
    console.warn("[SellCore Block 018] Bridge failed safely:", error);
  }
}