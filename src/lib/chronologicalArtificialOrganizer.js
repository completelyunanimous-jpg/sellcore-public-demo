const STORAGE_KEY = "sellcore:chronological-artificial-organizer";
const POSITION_KEY = "sellcore:cao:floating-position";
const LOCK_KEY = "sellcore:cao:locked";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function readOrganizerRecords() {
  return safeJsonParse(localStorage.getItem(STORAGE_KEY), []);
}

function writeOrganizerRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 250)));
}

function byteSize(value) {
  try {
    return new Blob([String(value ?? "")]).size;
  } catch {
    return String(value ?? "").length;
  }
}

function readSellCoreQuantities() {
  const keys = Object.keys(localStorage);
  let totalLocalBytes = 0;

  keys.forEach((key) => {
    try {
      totalLocalBytes += byteSize(localStorage.getItem(key));
    } catch {
      totalLocalBytes += 0;
    }
  });

  const readArrayCount = (...possibleKeys) => {
    for (const key of possibleKeys) {
      const parsed = safeJsonParse(localStorage.getItem(key), null);
      if (Array.isArray(parsed)) return parsed.length;
      if (parsed && typeof parsed === "object") return Object.keys(parsed).length;
    }
    return 0;
  };

  return {
    localStorageKeys: keys.length,
    totalLocalBytes,
    listings: readArrayCount("sellcore:listings", "sellcoreListings", "listings"),
    feedItems: readArrayCount("sellcore:feed", "sellcoreFeed", "feedItems"),
    profiles: readArrayCount("sellcore:profiles", "sellcoreProfiles", "profiles"),
    personas: readArrayCount("sellcore:personas", "sellcorePersonas", "personas"),
    savedItems: readArrayCount("sellcore:saved", "sellcoreSaved", "savedItems"),
    actions: readArrayCount("sellcore:actions", "sellcoreActions", "actionHistory"),
    automationRecords: readArrayCount("sellcore:automation", "sellcoreAutomation", "automationRecords"),
    mediaRecords: readArrayCount("sellcore:media", "sellcoreMedia", "mediaRecords"),
    organizerRecords: readOrganizerRecords().length,
    coreFixEntries: readArrayCount("sellcore:corefix:entries", "corefixEntries"),
    cellCoreLinks: readArrayCount("sellcore:cellcore:links", "cellcoreLinks")
  };
}

function createOrganizerRecord(type, source, details = {}) {
  const records = readOrganizerRecords();

  const record = {
    id: `cao-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    type,
    source,
    details,
    quantities: readSellCoreQuantities()
  };

  writeOrganizerRecords([record, ...records]);

  return record;
}

function metric(label, value) {
  return `
    <div style="border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:10px; background:rgba(255,255,255,0.05);">
      <div style="font-size:11px; opacity:0.64;">${label}</div>
      <div style="font-size:18px; font-weight:900; margin-top:3px;">${value}</div>
    </div>
  `;
}

function actionButton(id, label, note = "") {
  return `
    <button id="${id}" style="width:100%; text-align:left; border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:11px; background:rgba(255,255,255,0.055); color:white; font-weight:800;">
      <div>${label}</div>
      ${note ? `<div style="font-size:11px; opacity:0.62; margin-top:3px; font-weight:500;">${note}</div>` : ""}
    </button>
  `;
}

function buildPanel() {
  document.getElementById("sellcore-cao-panel")?.remove();

  const quantities = readSellCoreQuantities();
  const records = readOrganizerRecords();
  const locked = localStorage.getItem(LOCK_KEY) === "true";

  const panel = document.createElement("div");
  panel.id = "sellcore-cao-panel";
  panel.style.position = "fixed";
  panel.style.right = "12px";
  panel.style.top = "86px";
  panel.style.width = "min(380px, calc(100vw - 24px))";
  panel.style.maxHeight = "calc(100vh - 112px)";
  panel.style.overflow = "auto";
  panel.style.zIndex = "999999";
  panel.style.border = "1px solid rgba(255,255,255,0.18)";
  panel.style.borderRadius = "22px";
  panel.style.padding = "14px";
  panel.style.background = "rgba(5, 12, 28, 0.96)";
  panel.style.backdropFilter = "blur(16px)";
  panel.style.color = "white";
  panel.style.fontFamily = "Arial, sans-serif";
  panel.style.boxShadow = "0 20px 70px rgba(0,0,0,0.48)";

  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
      <div>
        <div style="font-size:12px; letter-spacing:0.14em; opacity:0.7;">BLOCK 015</div>
        <div style="font-size:18px; font-weight:900;">Core Organizer Dashboard</div>
        <div style="font-size:12px; opacity:0.62; margin-top:2px;">CAO Assistant + System Actions</div>
      </div>
      <button id="sellcore-cao-close" style="border:0; border-radius:999px; padding:7px 11px; background:white; color:#06101f; font-weight:900;">X</button>
    </div>

    <div style="margin-top:12px; font-size:13px; opacity:0.82; line-height:1.45;">
      Measures SellCore local activity, organizes system records, and prepares the bridge toward CoreFix and CellCore.
    </div>

    <div style="margin-top:14px; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      ${metric("Listings", quantities.listings)}
      ${metric("Feed", quantities.feedItems)}
      ${metric("Profiles", quantities.profiles)}
      ${metric("Personas", quantities.personas)}
      ${metric("Saved", quantities.savedItems)}
      ${metric("Actions", quantities.actions)}
      ${metric("Automation", quantities.automationRecords)}
      ${metric("Media", quantities.mediaRecords)}
      ${metric("CoreFix Prep", quantities.coreFixEntries)}
      ${metric("CellCore Links", quantities.cellCoreLinks)}
      ${metric("Storage Keys", quantities.localStorageKeys)}
      ${metric("Bytes", quantities.totalLocalBytes)}
    </div>

    <div style="margin-top:16px;">
      <div style="font-size:12px; letter-spacing:0.14em; opacity:0.7; margin-bottom:8px;">CAO ACTIONS</div>
      <div style="display:grid; gap:8px;">
        ${actionButton("sellcore-cao-scan", "Run Quantity Scan", "Refresh local counts and create a scan record.")}
        ${actionButton("sellcore-cao-export", "Export Organizer JSON", "Download CAO records and system quantities.")}
        ${actionButton("sellcore-cao-toggle-lock", locked ? "Unlock Floating CAO Button" : "Lock Floating CAO Button", locked ? "Allow the CAO button to move again." : "Prevent accidental dragging.")}
        ${actionButton("sellcore-cao-reset-position", "Reset CAO Button Position", "Move the button back to the mobile-safe top-right zone.")}
        ${actionButton("sellcore-cao-corefix", "Prepare CoreFix Entry Layer", "Creates the placeholder storage lane for Block 016.")}
        ${actionButton("sellcore-cao-cellcore", "Prepare CellCore Link Layer", "Creates the placeholder hub lane for future module links.")}
      </div>
    </div>

    <div style="margin-top:16px;">
      <div style="font-size:12px; letter-spacing:0.14em; opacity:0.7; margin-bottom:8px;">RECENT ORGANIZER RECORDS</div>
      <div style="font-size:12px; opacity:0.68; margin-bottom:8px;">Records stored: ${records.length}</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${records.slice(0, 6).map((record) => `
          <div style="border:1px solid rgba(255,255,255,0.12); border-radius:12px; padding:8px; background:rgba(255,255,255,0.035);">
            <div style="font-size:11px; opacity:0.65;">${new Date(record.timestamp).toLocaleString()}</div>
            <div style="font-size:13px; font-weight:900;">${record.type}</div>
            <div style="font-size:11px; opacity:0.7;">${record.source}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  document.getElementById("sellcore-cao-close")?.addEventListener("click", () => panel.remove());

  document.getElementById("sellcore-cao-scan")?.addEventListener("click", () => {
    createOrganizerRecord("manual_quantity_scan", "core_organizer_dashboard");
    buildPanel();
  });

  document.getElementById("sellcore-cao-export")?.addEventListener("click", () => {
    const data = {
      exportedAt: new Date().toISOString(),
      block: "015",
      system: "SellCore Core Organizer Dashboard",
      quantities: readSellCoreQuantities(),
      records: readOrganizerRecords()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `sellcore-core-organizer-${new Date().toISOString().replaceAll(":", "-")}.json`;
    link.click();

    URL.revokeObjectURL(url);
    createOrganizerRecord("organizer_exported", "core_organizer_dashboard");
  });

  document.getElementById("sellcore-cao-toggle-lock")?.addEventListener("click", () => {
    const next = !(localStorage.getItem(LOCK_KEY) === "true");
    localStorage.setItem(LOCK_KEY, String(next));
    createOrganizerRecord(next ? "cao_button_locked" : "cao_button_unlocked", "core_organizer_dashboard");
    buildPanel();
  });

  document.getElementById("sellcore-cao-reset-position")?.addEventListener("click", () => {
    localStorage.removeItem(POSITION_KEY);
    createOrganizerRecord("cao_position_reset", "core_organizer_dashboard");
    document.getElementById("sellcore-cao-button")?.remove();
    buildButton();
  });

  document.getElementById("sellcore-cao-corefix")?.addEventListener("click", () => {
    if (!localStorage.getItem("sellcore:corefix:entries")) {
      localStorage.setItem("sellcore:corefix:entries", JSON.stringify([]));
    }
    createOrganizerRecord("corefix_entry_layer_prepared", "core_organizer_dashboard");
    buildPanel();
  });

  document.getElementById("sellcore-cao-cellcore")?.addEventListener("click", () => {
    if (!localStorage.getItem("sellcore:cellcore:links")) {
      localStorage.setItem("sellcore:cellcore:links", JSON.stringify([]));
    }
    createOrganizerRecord("cellcore_link_layer_prepared", "core_organizer_dashboard");
    buildPanel();
  });
}

function enableFloatingCaoDrag(target) {
  let isDragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let startRight = 0;
  let startTop = 0;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  target.addEventListener("pointerdown", (event) => {
    if (localStorage.getItem(LOCK_KEY) === "true") return;

    isDragging = true;
    moved = false;
    target.setPointerCapture?.(event.pointerId);
    target.style.cursor = "grabbing";

    const rect = target.getBoundingClientRect();
    startX = event.clientX;
    startY = event.clientY;
    startRight = window.innerWidth - rect.right;
    startTop = rect.top;
  });

  target.addEventListener("pointermove", (event) => {
    if (!isDragging) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;

    const nextRight = clamp(startRight - dx, 8, window.innerWidth - 58);
    const nextTop = clamp(startTop + dy, 64, window.innerHeight - 96);

    target.style.right = `${nextRight}px`;
    target.style.top = `${nextTop}px`;
    target.style.bottom = "auto";

    localStorage.setItem(POSITION_KEY, JSON.stringify({
      right: nextRight,
      top: nextTop,
      savedAt: new Date().toISOString()
    }));
  });

  target.addEventListener("pointerup", (event) => {
    if (!isDragging) return;

    isDragging = false;
    target.releasePointerCapture?.(event.pointerId);
    target.style.cursor = "grab";

    if (moved) {
      createOrganizerRecord("cao_button_moved", "pointer_drag");
      target.dataset.justDragged = "true";
      setTimeout(() => {
        target.dataset.justDragged = "false";
      }, 260);
    }
  });
}

function buildButton() {
  if (document.getElementById("sellcore-cao-button")) return;

  const button = document.createElement("button");
  button.id = "sellcore-cao-button";
  button.textContent = "CAO";
  button.title = "Core Organizer Assistant";
  button.style.position = "fixed";
  button.style.right = "14px";
  button.style.top = "92px";
  button.style.zIndex = "999998";
  button.style.border = "0";
  button.style.borderRadius = "999px";
  button.style.padding = "12px 14px";
  button.style.background = "#f3c75f";
  button.style.color = "#07101d";
  button.style.fontWeight = "900";
  button.style.boxShadow = "0 12px 35px rgba(0,0,0,0.3)";
  button.style.cursor = "grab";
  button.style.touchAction = "none";

  try {
    const saved = safeJsonParse(localStorage.getItem(POSITION_KEY), null);
    if (saved && Number.isFinite(saved.right) && Number.isFinite(saved.top)) {
      button.style.right = `${saved.right}px`;
      button.style.top = `${saved.top}px`;
      button.style.bottom = "auto";
    }
  } catch {
    // Position recovery must never break SellCore.
  }

  enableFloatingCaoDrag(button);

  button.addEventListener("click", () => {
    if (button.dataset.justDragged === "true") return;

    createOrganizerRecord("panel_opened", "cao_button");
    buildPanel();
  });

  document.body.appendChild(button);
}

function patchLocalStorageTracking() {
  if (window.__SELLCORE_CAO_STORAGE_PATCHED__) return;
  window.__SELLCORE_CAO_STORAGE_PATCHED__ = true;

  const originalSetItem = localStorage.setItem.bind(localStorage);

  localStorage.setItem = (key, value) => {
    originalSetItem(key, value);

    if (key === STORAGE_KEY) return;

    try {
      createOrganizerRecord("localStorage_write", "localStorage.setItem", {
        key,
        valueBytes: byteSize(value)
      });
    } catch {
      // Organizer must never break SellCore.
    }
  };
}

export function installChronologicalArtificialOrganizer() {
  try {
    patchLocalStorageTracking();
    createOrganizerRecord("organizer_boot", "block_015_core_organizer_dashboard");
    buildButton();
    console.info("[SellCore Block 015] Core Organizer Dashboard installed.");
  } catch (error) {
    console.warn("[SellCore Block 015] Organizer failed safely:", error);
  }
}