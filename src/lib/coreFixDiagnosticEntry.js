const COREFIX_ENTRIES_KEY = "sellcore:corefix:entries";
const COREFIX_CARDS_KEY = "sellcore:corefix:cards";
const COREFIX_PACKS_KEY = "sellcore:corefix:packs";
const LATEST_KEY = "sellcore:corefix:latest";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function readEntries() {
  return safeJsonParse(localStorage.getItem(COREFIX_ENTRIES_KEY), []);
}

function writeEntries(entries) {
  localStorage.setItem(COREFIX_ENTRIES_KEY, JSON.stringify(entries.slice(0, 200)));
}

function readCards() {
  return safeJsonParse(localStorage.getItem(COREFIX_CARDS_KEY), []);
}

function writeCards(cards) {
  localStorage.setItem(COREFIX_CARDS_KEY, JSON.stringify(cards.slice(0, 300)));
}

function readPacks() {
  return safeJsonParse(localStorage.getItem(COREFIX_PACKS_KEY), []);
}

function writePacks(packs) {
  localStorage.setItem(COREFIX_PACKS_KEY, JSON.stringify(packs.slice(0, 100)));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function classifyProblem(text, category) {
  const lower = String(text || "").toLowerCase();

  if (category === "React" || lower.includes("jsx") || lower.includes("component") || lower.includes("usestate")) {
    return {
      likelyCause: "React component, JSX, state, import, or render-flow issue.",
      sampleFix: "Check JSX closing tags, component exports, imports, state names, and whether the component is mounted correctly.",
      nextStep: "Create a smaller test component and run npm run build before merging the fix into the full app.",
      fullFixDirection: "Audit the component tree, confirm imports/exports, isolate the failing component, rebuild JSX structure, then run a production build."
    };
  }

  if (category === "Vite" || lower.includes("vite") || lower.includes("build") || lower.includes("module") || lower.includes("utf-8")) {
    return {
      likelyCause: "Vite build, import path, module, missing file, or encoding issue.",
      sampleFix: "Run npm run build, read the first error, verify the exact file path, and rewrite suspicious files as UTF-8 without BOM.",
      nextStep: "Fix the first Vite error before chasing secondary errors.",
      fullFixDirection: "Repair the exact failing import/file/encoding path, rebuild locally, then deploy through GitHub Pages after build passes."
    };
  }

  if (category === "PowerShell" || lower.includes("powershell") || lower.includes("script") || lower.includes("not recognized")) {
    return {
      likelyCause: "PowerShell path, quote, syntax, execution-location, or command-context issue.",
      sampleFix: "Run pwd, confirm the target file exists with Test-Path, then execute one clean command block from the project root.",
      nextStep: "Stop at the first red error and convert it into a CoreFix card.",
      fullFixDirection: "Normalize the working directory, rewrite the command with safe quoting, verify each file path, then re-run one command group at a time."
    };
  }

  if (category === "GitHub" || lower.includes("git") || lower.includes("push") || lower.includes("workflow") || lower.includes("pages")) {
    return {
      likelyCause: "Git status, branch, remote, workflow, or GitHub Pages deployment issue.",
      sampleFix: "Run git status, git log --oneline -5, and gh run list --repo completelyunanimous-jpg/sellcore-public-demo --limit 5.",
      nextStep: "Only push after local build passes and the intended files are staged.",
      fullFixDirection: "Verify repo state, confirm branch/head, inspect failed workflow logs, repair the deployment contract, then push a single clean commit."
    };
  }

  return {
    likelyCause: "General app logic, workflow, data, or UI interaction issue.",
    sampleFix: "Reduce the problem to the smallest visible symptom, identify the last changed block, and test one fix at a time.",
    nextStep: "Save the diagnosis as a reusable CoreFix card.",
    fullFixDirection: "Document the symptom, isolate the last change, create a controlled test, apply one fix, and convert the result into reusable product material."
  };
}

function createDiagnostic(problem, category) {
  return {
    id: `corefix-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    category,
    problem,
    diagnosis: classifyProblem(problem, category),
    status: "free_diagnostic_preview",
    productLane: "Free diagnosis → sample fix → paid full fix → card pack → custom work"
  };
}

function createProductCardFromDiagnostic(diagnostic, tier = "free_sample") {
  const tierLabels = {
    free_sample: "Free Sample Fix",
    full_fix: "$0.95 Full Fix",
    paid_pack: "$8 CoreFix Card Pack",
    custom_review: "$25 Project Review"
  };

  return {
    cardId: `corefix-card-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sourceDiagnosticId: diagnostic.id,
    createdAt: new Date().toISOString(),
    savedAt: new Date().toISOString(),
    title: `${diagnostic.category} CoreFix Card`,
    tier,
    tierLabel: tierLabels[tier] || "CoreFix Card",
    category: diagnostic.category,
    problem: diagnostic.problem,
    likelyCause: diagnostic.diagnosis?.likelyCause || "",
    sampleFix: diagnostic.diagnosis?.sampleFix || "",
    nextStep: diagnostic.diagnosis?.nextStep || "",
    fullFixDirection: diagnostic.diagnosis?.fullFixDirection || "",
    productUse: "Reusable diagnostic card for SellCore/CoreFix product funnel.",
    status: "saved_corefix_product_card"
  };
}

function createProductPack(cards) {
  const now = new Date().toISOString();

  return {
    packId: `corefix-pack-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: now,
    title: "CoreFix Starter Card Pack",
    description: "Reusable CoreFix cards generated from diagnostics. Built for free samples, paid fixes, card packs, and client review workflows.",
    priceLane: "$8 React/Vite/Card Pack lane",
    cardCount: cards.length,
    cards,
    exportNote: "This JSON can become a downloadable product pack, Gumroad file, client preview, or internal repair library."
  };
}

function renderRecent(entries) {
  if (!entries.length) {
    return `<div style="font-size:12px; opacity:0.62;">No diagnostics yet.</div>`;
  }

  return entries.slice(0, 5).map((entry) => `
    <div style="border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:10px; background:rgba(255,255,255,0.045);">
      <div style="font-size:11px; opacity:0.62;">${new Date(entry.createdAt).toLocaleString()}</div>
      <div style="font-size:13px; font-weight:900;">${escapeHtml(entry.category)}</div>
      <div style="margin-top:8px; font-size:12px; opacity:0.82; line-height:1.4;">${escapeHtml(entry.problem).slice(0, 160)}</div>
      <div style="margin-top:8px; font-size:12px; line-height:1.4;">
        <strong>Likely cause:</strong> ${escapeHtml(entry.diagnosis?.likelyCause || "Unknown")}
      </div>
    </div>
  `).join("");
}

function renderCardLibrary(cards) {
  if (!cards.length) {
    return `<div style="font-size:12px; opacity:0.62;">No CoreFix cards yet. Generate a diagnostic, then save it as a card.</div>`;
  }

  return cards.slice(0, 8).map((card, index) => `
    <div style="border:1px solid rgba(125,227,255,0.22); border-radius:14px; padding:10px; background:rgba(125,227,255,0.055);">
      <div style="display:flex; justify-content:space-between; gap:8px;">
        <div>
          <div style="font-size:11px; opacity:0.62;">${escapeHtml(card.tierLabel || "CoreFix Card")}</div>
          <div style="font-size:13px; font-weight:950;">${escapeHtml(card.title || `${card.category} CoreFix Card`)}</div>
        </div>
        <button type="button" data-export-card-index="${index}" style="border:0; border-radius:999px; padding:6px 9px; background:#7de3ff; color:#07101d; font-size:11px; font-weight:900;">Export</button>
      </div>
      <div style="margin-top:8px; font-size:12px; opacity:0.82; line-height:1.4;">${escapeHtml(card.problem || "").slice(0, 150)}</div>
      <div style="margin-top:8px; font-size:12px;"><strong>Sample:</strong> ${escapeHtml(card.sampleFix || "").slice(0, 140)}</div>
    </div>
  `).join("");
}

function buildCoreFixPanel() {
  document.getElementById("sellcore-corefix-panel")?.remove();

  const entries = readEntries();
  const cards = readCards();
  const packs = readPacks();

  const panel = document.createElement("div");
  panel.id = "sellcore-corefix-panel";
  panel.style.position = "fixed";
  panel.style.left = "12px";
  panel.style.top = "86px";
  panel.style.width = "min(440px, calc(100vw - 24px))";
  panel.style.maxHeight = "calc(100vh - 112px)";
  panel.style.overflow = "auto";
  panel.style.zIndex = "999997";
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
        <div style="font-size:12px; letter-spacing:0.14em; opacity:0.7;">BLOCK 017</div>
        <div style="font-size:18px; font-weight:900;">CoreFix Card Generator</div>
        <div style="font-size:12px; opacity:0.62; margin-top:2px;">Diagnostic → Card → Product Pack</div>
      </div>
      <button type="button" id="sellcore-corefix-close" style="border:0; border-radius:999px; padding:7px 11px; background:white; color:#06101f; font-weight:900;">X</button>
    </div>

    <div style="margin-top:12px; font-size:13px; opacity:0.82; line-height:1.45;">
      Turn errors, broken workflows, and app problems into reusable CoreFix cards. Export cards individually or bundle them into a product pack.
    </div>

    <div style="margin-top:14px; display:grid; gap:8px;">
      <select id="sellcore-corefix-category" style="width:100%; border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:11px; background:#07111f; color:white; font-weight:800;">
        <option value="React">React</option>
        <option value="Vite">Vite</option>
        <option value="PowerShell">PowerShell</option>
        <option value="GitHub">GitHub</option>
        <option value="General">General</option>
      </select>

      <textarea id="sellcore-corefix-problem" placeholder="Paste the problem, error, or app issue here..." style="width:100%; min-height:112px; resize:vertical; border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:11px; background:rgba(255,255,255,0.055); color:white; font-family:Arial, sans-serif; box-sizing:border-box;"></textarea>

      <button type="button" id="sellcore-corefix-diagnose" style="width:100%; border:0; border-radius:14px; padding:12px; background:#f3c75f; color:#07101d; font-weight:950;">
        Generate Free Diagnostic Preview
      </button>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <button type="button" id="sellcore-corefix-save-sample" style="border:1px solid rgba(255,255,255,0.2); border-radius:14px; padding:12px; background:transparent; color:white; font-weight:900;">
          Save Free Sample Card
        </button>
        <button type="button" id="sellcore-corefix-save-full" style="border:0; border-radius:14px; padding:12px; background:#7de3ff; color:#07101d; font-weight:950;">
          Save Full Fix Card
        </button>
      </div>

      <button type="button" id="sellcore-corefix-export-pack" style="width:100%; border:1px solid rgba(125,227,255,0.35); border-radius:14px; padding:12px; background:rgba(125,227,255,0.07); color:white; font-weight:950;">
        Export CoreFix Product Pack JSON
      </button>
    </div>

    <div id="sellcore-corefix-output" style="margin-top:14px;"></div>

    <div style="margin-top:16px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
      <div style="border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:10px; background:rgba(255,255,255,0.05);">
        <div style="font-size:11px; opacity:0.64;">Diagnostics</div>
        <div style="font-size:18px; font-weight:900; margin-top:3px;">${entries.length}</div>
      </div>
      <div style="border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:10px; background:rgba(255,255,255,0.05);">
        <div style="font-size:11px; opacity:0.64;">Cards</div>
        <div style="font-size:18px; font-weight:900; margin-top:3px;">${cards.length}</div>
      </div>
      <div style="border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:10px; background:rgba(255,255,255,0.05);">
        <div style="font-size:11px; opacity:0.64;">Packs</div>
        <div style="font-size:18px; font-weight:900; margin-top:3px;">${packs.length}</div>
      </div>
    </div>

    <div style="margin-top:16px;">
      <div style="font-size:12px; letter-spacing:0.14em; opacity:0.7; margin-bottom:8px;">COREFIX CARD LIBRARY</div>
      <div id="sellcore-corefix-card-library" style="display:flex; flex-direction:column; gap:8px;">
        ${renderCardLibrary(cards)}
      </div>
    </div>

    <div style="margin-top:16px;">
      <div style="font-size:12px; letter-spacing:0.14em; opacity:0.7; margin-bottom:8px;">RECENT DIAGNOSTICS</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${renderRecent(entries)}
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  const closeBtn = document.getElementById("sellcore-corefix-close");
  const diagnoseBtn = document.getElementById("sellcore-corefix-diagnose");
  const saveSampleBtn = document.getElementById("sellcore-corefix-save-sample");
  const saveFullBtn = document.getElementById("sellcore-corefix-save-full");
  const exportPackBtn = document.getElementById("sellcore-corefix-export-pack");
  const output = document.getElementById("sellcore-corefix-output");

  closeBtn.onclick = () => panel.remove();

  diagnoseBtn.onclick = () => {
    const problemEl = document.getElementById("sellcore-corefix-problem");
    const categoryEl = document.getElementById("sellcore-corefix-category");

    const problem = problemEl?.value || "";
    const category = categoryEl?.value || "General";

    if (!problem.trim()) {
      output.innerHTML = `
        <div style="border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:10px; background:rgba(255,255,255,0.045); font-size:13px;">
          Add a problem first. CoreFix needs an error, symptom, or app issue to diagnose.
        </div>
      `;
      return;
    }

    const diagnostic = createDiagnostic(problem, category);
    localStorage.setItem(LATEST_KEY, JSON.stringify(diagnostic));

    const entries = readEntries();
    writeEntries([diagnostic, ...entries]);

    output.innerHTML = `
      <div style="border:1px solid rgba(243,199,95,0.35); border-radius:16px; padding:12px; background:rgba(243,199,95,0.08);">
        <div style="font-size:12px; opacity:0.72;">FREE DIAGNOSTIC PREVIEW</div>
        <div style="margin-top:8px; font-size:13px; line-height:1.5;"><strong>Likely Cause:</strong> ${escapeHtml(diagnostic.diagnosis.likelyCause)}</div>
        <div style="margin-top:8px; font-size:13px; line-height:1.5;"><strong>Sample Fix:</strong> ${escapeHtml(diagnostic.diagnosis.sampleFix)}</div>
        <div style="margin-top:8px; font-size:13px; line-height:1.5;"><strong>Next Step:</strong> ${escapeHtml(diagnostic.diagnosis.nextStep)}</div>
        <div style="margin-top:8px; font-size:13px; line-height:1.5;"><strong>Full Fix Direction:</strong> ${escapeHtml(diagnostic.diagnosis.fullFixDirection)}</div>
        <div style="margin-top:10px; font-size:11px; opacity:0.62;">Product lane: ${escapeHtml(diagnostic.productLane)}</div>
      </div>
    `;
  };

  function saveCard(tier) {
    const latest = safeJsonParse(localStorage.getItem(LATEST_KEY), null);

    if (!latest) {
      output.innerHTML = `
        <div style="border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:10px; background:rgba(255,255,255,0.045); font-size:13px;">
          Generate a diagnostic first, then save it as a CoreFix product card.
        </div>
      `;
      return;
    }

    const cards = readCards();
    const card = createProductCardFromDiagnostic(latest, tier);

    writeCards([card, ...cards]);

    output.innerHTML = `
      <div style="border:1px solid rgba(95,243,176,0.35); border-radius:16px; padding:12px; background:rgba(95,243,176,0.08); font-size:13px; line-height:1.5;">
        ${escapeHtml(card.tierLabel)} saved. This card can now be exported alone or included in a CoreFix product pack.
      </div>
    `;

    setTimeout(buildCoreFixPanel, 450);
  }

  saveSampleBtn.onclick = () => saveCard("free_sample");
  saveFullBtn.onclick = () => saveCard("full_fix");

  exportPackBtn.onclick = () => {
    const cards = readCards();

    if (!cards.length) {
      output.innerHTML = `
        <div style="border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:10px; background:rgba(255,255,255,0.045); font-size:13px;">
          No cards to export yet. Save at least one CoreFix card first.
        </div>
      `;
      return;
    }

    const pack = createProductPack(cards);
    const packs = readPacks();
    writePacks([pack, ...packs]);

    downloadJson(`corefix-product-pack-${new Date().toISOString().replaceAll(":", "-")}.json`, pack);

    output.innerHTML = `
      <div style="border:1px solid rgba(125,227,255,0.35); border-radius:16px; padding:12px; background:rgba(125,227,255,0.08); font-size:13px; line-height:1.5;">
        CoreFix product pack exported. Pack contains ${pack.cardCount} card(s).
      </div>
    `;

    setTimeout(buildCoreFixPanel, 550);
  };

  panel.querySelectorAll("[data-export-card-index]").forEach((button) => {
    button.onclick = () => {
      const index = Number(button.getAttribute("data-export-card-index"));
      const cards = readCards();
      const card = cards[index];

      if (!card) return;

      downloadJson(`corefix-card-${card.category}-${new Date().toISOString().replaceAll(":", "-")}.json`, card);
    };
  });
}

function buildCoreFixButton() {
  if (document.getElementById("sellcore-corefix-button")) return;

  const button = document.createElement("button");
  button.id = "sellcore-corefix-button";
  button.type = "button";
  button.textContent = "CoreFix";
  button.title = "CoreFix Card Generator";
  button.style.position = "fixed";
  button.style.left = "12px";
  button.style.top = "150px";
  button.style.zIndex = "999996";
  button.style.border = "0";
  button.style.borderRadius = "999px";
  button.style.padding = "11px 13px";
  button.style.background = "#7de3ff";
  button.style.color = "#07101d";
  button.style.fontWeight = "950";
  button.style.boxShadow = "0 12px 35px rgba(0,0,0,0.3)";
  button.style.pointerEvents = "auto";

  button.onclick = () => {
    buildCoreFixPanel();
  };

  document.body.appendChild(button);
}

export function installCoreFixDiagnosticEntry() {
  try {
    if (!localStorage.getItem(COREFIX_ENTRIES_KEY)) {
      localStorage.setItem(COREFIX_ENTRIES_KEY, JSON.stringify([]));
    }

    if (!localStorage.getItem(COREFIX_CARDS_KEY)) {
      localStorage.setItem(COREFIX_CARDS_KEY, JSON.stringify([]));
    }

    if (!localStorage.getItem(COREFIX_PACKS_KEY)) {
      localStorage.setItem(COREFIX_PACKS_KEY, JSON.stringify([]));
    }

    buildCoreFixButton();
    console.info("[SellCore Block 017] CoreFix Card Generator + Product Pack Layer installed.");
  } catch (error) {
    console.warn("[SellCore Block 017] CoreFix failed safely:", error);
  }
}