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
  localStorage.setItem(COREFIX_CARDS_KEY, JSON.stringify(cards.slice(0, 200)));
}

function classifyProblem(text, category) {
  const lower = String(text || "").toLowerCase();

  if (category === "React" || lower.includes("jsx") || lower.includes("component") || lower.includes("usestate")) {
    return {
      likelyCause: "React component, JSX, state, import, or render-flow issue.",
      sampleFix: "Check JSX closing tags, component exports, imports, state names, and whether the component is mounted correctly.",
      nextStep: "Create a smaller test component and run npm run build before merging the fix into the full app."
    };
  }

  if (category === "Vite" || lower.includes("vite") || lower.includes("build") || lower.includes("module") || lower.includes("utf-8")) {
    return {
      likelyCause: "Vite build, import path, module, missing file, or encoding issue.",
      sampleFix: "Run npm run build, read the first error, verify the exact file path, and rewrite suspicious files as UTF-8 without BOM.",
      nextStep: "Fix the first Vite error before chasing secondary errors."
    };
  }

  if (category === "PowerShell" || lower.includes("powershell") || lower.includes("script") || lower.includes("not recognized")) {
    return {
      likelyCause: "PowerShell path, quote, syntax, execution-location, or command-context issue.",
      sampleFix: "Run pwd, confirm the target file exists with Test-Path, then execute one clean command block from the project root.",
      nextStep: "Stop at the first red error and convert it into a CoreFix card."
    };
  }

  if (category === "GitHub" || lower.includes("git") || lower.includes("push") || lower.includes("workflow") || lower.includes("pages")) {
    return {
      likelyCause: "Git status, branch, remote, workflow, or GitHub Pages deployment issue.",
      sampleFix: "Run git status, git log --oneline -5, and gh run list --repo completelyunanimous-jpg/sellcore-public-demo --limit 5.",
      nextStep: "Only push after local build passes and the intended files are staged."
    };
  }

  return {
    likelyCause: "General app logic, workflow, data, or UI interaction issue.",
    sampleFix: "Reduce the problem to the smallest visible symptom, identify the last changed block, and test one fix at a time.",
    nextStep: "Save the diagnosis as a reusable CoreFix card."
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function buildCoreFixPanel() {
  document.getElementById("sellcore-corefix-panel")?.remove();

  const entries = readEntries();
  const cards = readCards();

  const panel = document.createElement("div");
  panel.id = "sellcore-corefix-panel";
  panel.style.position = "fixed";
  panel.style.left = "12px";
  panel.style.top = "86px";
  panel.style.width = "min(420px, calc(100vw - 24px))";
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
        <div style="font-size:12px; letter-spacing:0.14em; opacity:0.7;">BLOCK 016A</div>
        <div style="font-size:18px; font-weight:900;">CoreFix Diagnostic Entry</div>
        <div style="font-size:12px; opacity:0.62; margin-top:2px;">Interaction repair active</div>
      </div>
      <button type="button" id="sellcore-corefix-close" style="border:0; border-radius:999px; padding:7px 11px; background:white; color:#06101f; font-weight:900;">X</button>
    </div>

    <div style="margin-top:12px; font-size:13px; opacity:0.82; line-height:1.45;">
      Enter a bug, error, app idea problem, or broken workflow. CoreFix creates a free diagnostic preview and saves it as reusable product material.
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

      <button type="button" id="sellcore-corefix-save-card" style="width:100%; border:1px solid rgba(255,255,255,0.2); border-radius:14px; padding:12px; background:transparent; color:white; font-weight:900;">
        Save Latest Diagnostic as CoreFix Card
      </button>
    </div>

    <div id="sellcore-corefix-output" style="margin-top:14px;"></div>

    <div style="margin-top:16px; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      <div style="border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:10px; background:rgba(255,255,255,0.05);">
        <div style="font-size:11px; opacity:0.64;">Diagnostics</div>
        <div style="font-size:18px; font-weight:900; margin-top:3px;">${entries.length}</div>
      </div>
      <div style="border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:10px; background:rgba(255,255,255,0.05);">
        <div style="font-size:11px; opacity:0.64;">Saved Cards</div>
        <div style="font-size:18px; font-weight:900; margin-top:3px;">${cards.length}</div>
      </div>
    </div>

    <div style="margin-top:16px;">
      <div style="font-size:12px; letter-spacing:0.14em; opacity:0.7; margin-bottom:8px;">RECENT COREFIX DIAGNOSTICS</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${renderRecent(entries)}
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  const closeBtn = document.getElementById("sellcore-corefix-close");
  const diagnoseBtn = document.getElementById("sellcore-corefix-diagnose");
  const saveBtn = document.getElementById("sellcore-corefix-save-card");
  const output = document.getElementById("sellcore-corefix-output");

  closeBtn.onclick = () => {
    panel.remove();
  };

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
        <div style="margin-top:10px; font-size:11px; opacity:0.62;">Product lane: ${escapeHtml(diagnostic.productLane)}</div>
      </div>
    `;
  };

  saveBtn.onclick = () => {
    const latest = safeJsonParse(localStorage.getItem(LATEST_KEY), null);

    if (!latest) {
      output.innerHTML = `
        <div style="border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:10px; background:rgba(255,255,255,0.045); font-size:13px;">
          Generate a diagnostic first, then save it as a CoreFix card.
        </div>
      `;
      return;
    }

    const cards = readCards();
    const card = {
      ...latest,
      cardId: `corefix-card-${Date.now()}`,
      status: "saved_corefix_card",
      savedAt: new Date().toISOString()
    };

    writeCards([card, ...cards]);

    output.innerHTML = `
      <div style="border:1px solid rgba(95,243,176,0.35); border-radius:16px; padding:12px; background:rgba(95,243,176,0.08); font-size:13px; line-height:1.5;">
        CoreFix card saved. This can become a reusable fix pack item, paid single fix, or client diagnostic.
      </div>
    `;
  };
}

function buildCoreFixButton() {
  if (document.getElementById("sellcore-corefix-button")) return;

  const button = document.createElement("button");
  button.id = "sellcore-corefix-button";
  button.type = "button";
  button.textContent = "CoreFix";
  button.title = "CoreFix Diagnostic Entry";
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

    buildCoreFixButton();
    console.info("[SellCore Block 016A] CoreFix Diagnostic Entry interaction repair installed.");
  } catch (error) {
    console.warn("[SellCore Block 016A] CoreFix failed safely:", error);
  }
}