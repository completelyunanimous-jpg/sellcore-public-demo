const COREFIX_ENTRIES_KEY = "sellcore:corefix:entries";
const COREFIX_CARDS_KEY = "sellcore:corefix:cards";

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
      likelyCause: "React structure or JSX state flow issue.",
      sampleFix: "Check component export, JSX closing tags, state names, and whether the component is imported correctly.",
      nextStep: "Create a smaller reproduction component and verify it builds before merging into the main app."
    };
  }

  if (category === "Vite" || lower.includes("vite") || lower.includes("build") || lower.includes("module")) {
    return {
      likelyCause: "Vite build, path, import, or encoding issue.",
      sampleFix: "Run npm run build, inspect the exact file path in the error, then check imports, UTF-8 encoding, and missing files.",
      nextStep: "Fix the first error shown by Vite before chasing secondary errors."
    };
  }

  if (category === "PowerShell" || lower.includes("powershell") || lower.includes("script") || lower.includes("not recognized")) {
    return {
      likelyCause: "PowerShell path, syntax, quoting, or execution-context issue.",
      sampleFix: "Confirm the current folder with pwd, verify the file exists with Test-Path, then run the command from the project root.",
      nextStep: "Use one clean command block at a time and stop after the first red error."
    };
  }

  if (category === "GitHub" || lower.includes("git") || lower.includes("push") || lower.includes("workflow") || lower.includes("pages")) {
    return {
      likelyCause: "Git status, branch, remote, or GitHub Actions deployment issue.",
      sampleFix: "Run git status, git log --oneline -5, then gh run list --repo completelyunanimous-jpg/sellcore-public-demo --limit 5.",
      nextStep: "Only push after local build passes and the working tree has the intended changes."
    };
  }

  return {
    likelyCause: "General app logic or workflow issue.",
    sampleFix: "Reduce the problem to the smallest visible symptom, confirm what changed last, then test one fix at a time.",
    nextStep: "Save a diagnostic card so the issue becomes reusable CoreFix product material."
  };
}

function createDiagnostic(problem, category) {
  const diagnosis = classifyProblem(problem, category);

  return {
    id: `corefix-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    category,
    problem,
    diagnosis,
    status: "free_diagnostic_preview",
    productLane: "Free diagnosis → sample fix → paid full fix → card pack → custom work"
  };
}

function cardTemplate(entry) {
  return `
    <div style="border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:10px; background:rgba(255,255,255,0.045);">
      <div style="display:flex; justify-content:space-between; gap:8px; align-items:flex-start;">
        <div>
          <div style="font-size:11px; opacity:0.62;">${new Date(entry.createdAt).toLocaleString()}</div>
          <div style="font-size:13px; font-weight:900;">${entry.category}</div>
        </div>
        <div style="font-size:10px; opacity:0.62;">${entry.status}</div>
      </div>
      <div style="margin-top:8px; font-size:12px; opacity:0.82; line-height:1.4;">${String(entry.problem || "").slice(0, 160)}</div>
      <div style="margin-top:8px; font-size:12px; line-height:1.4;">
        <strong>Likely cause:</strong> ${entry.diagnosis?.likelyCause || "Unknown"}
      </div>
    </div>
  `;
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

  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
      <div>
        <div style="font-size:12px; letter-spacing:0.14em; opacity:0.7;">BLOCK 016</div>
        <div style="font-size:18px; font-weight:900;">CoreFix Diagnostic Entry</div>
        <div style="font-size:12px; opacity:0.62; margin-top:2px;">Free diagnosis → sample fix → paid product path</div>
      </div>
      <button id="sellcore-corefix-close" style="border:0; border-radius:999px; padding:7px 11px; background:white; color:#06101f; font-weight:900;">X</button>
    </div>

    <div style="margin-top:12px; font-size:13px; opacity:0.82; line-height:1.45;">
      Enter a bug, error, app idea problem, or broken workflow. CoreFix creates a free diagnostic preview and saves it as reusable product material.
    </div>

    <div style="margin-top:14px; display:grid; gap:8px;">
      <select id="sellcore-corefix-category" style="width:100%; border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:11px; background:#07111f; color:white; font-weight:800;">
        <option>React</option>
        <option>Vite</option>
        <option>PowerShell</option>
        <option>GitHub</option>
        <option>General</option>
      </select>

      <textarea id="sellcore-corefix-problem" placeholder="Paste the problem, error, or app issue here..." style="width:100%; min-height:108px; resize:vertical; border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:11px; background:rgba(255,255,255,0.055); color:white; font-family:Arial, sans-serif; box-sizing:border-box;"></textarea>

      <button id="sellcore-corefix-diagnose" style="width:100%; border:0; border-radius:14px; padding:12px; background:#f3c75f; color:#07101d; font-weight:950;">
        Generate Free Diagnostic Preview
      </button>

      <button id="sellcore-corefix-save-card" style="width:100%; border:1px solid rgba(255,255,255,0.2); border-radius:14px; padding:12px; background:transparent; color:white; font-weight:900;">
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
        ${entries.slice(0, 5).map(cardTemplate).join("") || `<div style="font-size:12px; opacity:0.62;">No diagnostics yet.</div>`}
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  let latestDiagnostic = null;

  document.getElementById("sellcore-corefix-close")?.addEventListener("click", () => panel.remove());

  document.getElementById("sellcore-corefix-diagnose")?.addEventListener("click", () => {
    const problem = document.getElementById("sellcore-corefix-problem")?.value || "";
    const category = document.getElementById("sellcore-corefix-category")?.value || "General";

    if (!problem.trim()) {
      document.getElementById("sellcore-corefix-output").innerHTML = `
        <div style="border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:10px; background:rgba(255,255,255,0.045); font-size:13px;">
          Add a problem first. CoreFix needs an error, symptom, or app issue to diagnose.
        </div>
      `;
      return;
    }

    latestDiagnostic = createDiagnostic(problem, category);
    const entries = readEntries();
    writeEntries([latestDiagnostic, ...entries]);

    document.getElementById("sellcore-corefix-output").innerHTML = `
      <div style="border:1px solid rgba(243,199,95,0.35); border-radius:16px; padding:12px; background:rgba(243,199,95,0.08);">
        <div style="font-size:12px; opacity:0.72;">FREE DIAGNOSTIC PREVIEW</div>
        <div style="margin-top:8px; font-size:13px; line-height:1.5;"><strong>Likely Cause:</strong> ${latestDiagnostic.diagnosis.likelyCause}</div>
        <div style="margin-top:8px; font-size:13px; line-height:1.5;"><strong>Sample Fix:</strong> ${latestDiagnostic.diagnosis.sampleFix}</div>
        <div style="margin-top:8px; font-size:13px; line-height:1.5;"><strong>Next Step:</strong> ${latestDiagnostic.diagnosis.nextStep}</div>
        <div style="margin-top:10px; font-size:11px; opacity:0.62;">Product lane: ${latestDiagnostic.productLane}</div>
      </div>
    `;

    try {
      window.dispatchEvent(new CustomEvent("sellcore:corefix:diagnostic-created", { detail: latestDiagnostic }));
    } catch {
      // Event bridge must never break CoreFix.
    }
  });

  document.getElementById("sellcore-corefix-save-card")?.addEventListener("click", () => {
    if (!latestDiagnostic) {
      const entries = readEntries();
      latestDiagnostic = entries[0] || null;
    }

    if (!latestDiagnostic) {
      document.getElementById("sellcore-corefix-output").innerHTML = `
        <div style="border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:10px; background:rgba(255,255,255,0.045); font-size:13px;">
          Generate a diagnostic first, then save it as a CoreFix card.
        </div>
      `;
      return;
    }

    const cards = readCards();
    const card = {
      ...latestDiagnostic,
      cardId: `corefix-card-${Date.now()}`,
      status: "saved_corefix_card",
      savedAt: new Date().toISOString()
    };

    writeCards([card, ...cards]);

    document.getElementById("sellcore-corefix-output").innerHTML = `
      <div style="border:1px solid rgba(95,243,176,0.35); border-radius:16px; padding:12px; background:rgba(95,243,176,0.08); font-size:13px; line-height:1.5;">
        CoreFix card saved. This can become a reusable fix pack item, paid single fix, or client diagnostic.
      </div>
    `;

    try {
      window.dispatchEvent(new CustomEvent("sellcore:corefix:card-saved", { detail: card }));
    } catch {
      // Event bridge must never break CoreFix.
    }

    setTimeout(buildCoreFixPanel, 450);
  });
}

function buildCoreFixButton() {
  if (document.getElementById("sellcore-corefix-button")) return;

  const button = document.createElement("button");
  button.id = "sellcore-corefix-button";
  button.textContent = "CoreFix";
  button.title = "CoreFix Diagnostic Entry";
  button.style.position = "fixed";
  button.style.left = "12px";
  button.style.bottom = "82px";
  button.style.zIndex = "999996";
  button.style.border = "0";
  button.style.borderRadius = "999px";
  button.style.padding = "11px 13px";
  button.style.background = "#7de3ff";
  button.style.color = "#07101d";
  button.style.fontWeight = "950";
  button.style.boxShadow = "0 12px 35px rgba(0,0,0,0.3)";

  button.addEventListener("click", () => {
    buildCoreFixPanel();
  });

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
    console.info("[SellCore Block 016] CoreFix Diagnostic Entry installed.");
  } catch (error) {
    console.warn("[SellCore Block 016] CoreFix failed safely:", error);
  }
}