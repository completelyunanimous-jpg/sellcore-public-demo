const STORAGE_KEY = "sellcore_chronological_artificial_organizer_v013";
const MAX_RECORDS = 300;

function safeJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getAllLocalStorage() {
  const entries = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;

    const raw = localStorage.getItem(key) || "";
    const parsed = safeJson(raw, null);

    entries.push({
      key,
      raw,
      parsed,
      bytes: new Blob([raw]).size
    });
  }

  return entries;
}

function countArrayByName(entries, names) {
  let total = 0;

  for (const entry of entries) {
    const key = entry.key.toLowerCase();

    if (!names.some((name) => key.includes(name))) continue;

    if (Array.isArray(entry.parsed)) {
      total += entry.parsed.length;
    } else if (entry.parsed && typeof entry.parsed === "object") {
      total += Object.keys(entry.parsed).length;
    }
  }

  return total;
}

export function readSellCoreQuantities() {
  const entries = getAllLocalStorage();
  const totalBytes = entries.reduce((sum, entry) => sum + entry.bytes, 0);

  const quantities = {
    timestamp: new Date().toISOString(),
    localStorageKeys: entries.length,
    totalLocalBytes: totalBytes,
    listings: countArrayByName(entries, ["listing", "listings"]),
    feedItems: countArrayByName(entries, ["feed"]),
    profiles: countArrayByName(entries, ["profile", "profiles"]),
    personas: countArrayByName(entries, ["persona", "personas"]),
    savedItems: countArrayByName(entries, ["saved"]),
    actions: countArrayByName(entries, ["action", "actions"]),
    automationRecords: countArrayByName(entries, ["automation"]),
    mediaRecords: countArrayByName(entries, ["media"]),
    organizerRecords: 0
  };

  const organizer = safeJson(localStorage.getItem(STORAGE_KEY), []);
  quantities.organizerRecords = Array.isArray(organizer) ? organizer.length : 0;

  return quantities;
}

export function createOrganizerRecord(type = "system_scan", source = "chronological_artificial_organizer", payload = {}) {
  const current = safeJson(localStorage.getItem(STORAGE_KEY), []);
  const records = Array.isArray(current) ? current : [];

  const record = {
    id: window.crypto && crypto.randomUUID ? crypto.randomUUID() : `cao-${Date.now()}-${Math.random()}`,
    timestamp: new Date().toISOString(),
    type,
    source,
    payload,
    quantities: readSellCoreQuantities()
  };

  records.unshift(record);

  const trimmed = records.slice(0, MAX_RECORDS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

  return record;
}

export function readOrganizerRecords() {
  const records = safeJson(localStorage.getItem(STORAGE_KEY), []);
  return Array.isArray(records) ? records : [];
}

function metric(label, value) {
  return `
    <div style="border:1px solid rgba(255,255,255,0.12); border-radius:12px; padding:9px;">
      <div style="font-size:11px; opacity:0.62;">${label}</div>
      <div style="font-size:18px; font-weight:900;">${value}</div>
    </div>
  `;
}

function buildPanel() {
  const existing = document.getElementById("sellcore-cao-panel");
  if (existing) existing.remove();

  const quantities = readSellCoreQuantities();
  const records = readOrganizerRecords();

  const panel = document.createElement("div");
  panel.id = "sellcore-cao-panel";
  panel.style.position = "fixed";
  panel.style.right = "12px";
  panel.style.bottom = "72px";
  panel.style.zIndex = "999999";
  panel.style.width = "min(340px, calc(100vw - 24px))";
  panel.style.maxHeight = "70vh";
  panel.style.overflow = "auto";
  panel.style.border = "1px solid rgba(255,255,255,0.18)";
  panel.style.borderRadius = "18px";
  panel.style.padding = "14px";
  panel.style.background = "rgba(5, 12, 28, 0.94)";
  panel.style.backdropFilter = "blur(14px)";
  panel.style.color = "white";
  panel.style.fontFamily = "Arial, sans-serif";
  panel.style.boxShadow = "0 20px 70px rgba(0,0,0,0.45)";

  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
      <div>
        <div style="font-size:12px; letter-spacing:0.14em; opacity:0.7;">BLOCK 013</div>
        <div style="font-size:17px; font-weight:800;">Chronological Organizer</div>
      </div>
      <button id="sellcore-cao-close" style="border:0; border-radius:999px; padding:6px 10px; background:white; color:#06101f; font-weight:800;">X</button>
    </div>

    <div style="margin-top:12px; font-size:13px; opacity:0.82; line-height:1.45;">
      Measures SellCore local activity by time, quantity, and storage weight.
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
      ${metric("Storage Keys", quantities.localStorageKeys)}
      ${metric("Bytes", quantities.totalLocalBytes)}
    </div>

    <button id="sellcore-cao-scan" style="margin-top:14px; width:100%; border:0; border-radius:14px; padding:11px; background:#f3c75f; color:#07101d; font-weight:900;">
      Run Quantity Scan
    </button>

    <button id="sellcore-cao-export" style="margin-top:8px; width:100%; border:1px solid rgba(255,255,255,0.22); border-radius:14px; padding:11px; background:transparent; color:white; font-weight:800;">
      Export Organizer JSON
    </button>

    <div style="margin-top:14px; font-size:12px; opacity:0.68;">
      Records stored: ${records.length}
    </div>

    <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">
      ${records.slice(0, 5).map((record) => `
        <div style="border:1px solid rgba(255,255,255,0.12); border-radius:12px; padding:8px;">
          <div style="font-size:11px; opacity:0.65;">${new Date(record.timestamp).toLocaleString()}</div>
          <div style="font-size:13px; font-weight:800;">${record.type}</div>
          <div style="font-size:11px; opacity:0.7;">Keys: ${record.quantities?.localStorageKeys ?? 0} | Bytes: ${record.quantities?.totalLocalBytes ?? 0}</div>
        </div>
      `).join("")}
    </div>
  `;

  document.body.appendChild(panel);

  document.getElementById("sellcore-cao-close")?.addEventListener("click", () => panel.remove());

  document.getElementById("sellcore-cao-scan")?.addEventListener("click", () => {
    createOrganizerRecord("manual_quantity_scan", "user_button");
    buildPanel();
  });

  document.getElementById("sellcore-cao-export")?.addEventListener("click", () => {
    const data = {
      exportedAt: new Date().toISOString(),
      quantities: readSellCoreQuantities(),
      records: readOrganizerRecords()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `sellcore-chronological-organizer-${new Date().toISOString().replaceAll(":", "-")}.json`;
    link.click();

    URL.revokeObjectURL(url);
  });
}

function buildButton() {
  if (document.getElementById("sellcore-cao-button")) return;

  const button = document.createElement("button");
  button.id = "sellcore-cao-button";
  button.textContent = "CAO";
  button.title = "Chronological Artificial Organizer";
  button.style.position = "fixed";
  button.style.right = "12px";
  button.style.bottom = "18px";
  button.style.zIndex = "999998";
  button.style.border = "0";
  button.style.borderRadius = "999px";
  button.style.padding = "12px 14px";
  button.style.background = "#f3c75f";
  button.style.color = "#07101d";
  button.style.fontWeight = "900";
  button.style.boxShadow = "0 12px 35px rgba(0,0,0,0.3)";

  button.addEventListener("click", () => {
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
        valueBytes: new Blob([String(value)]).size
      });
    } catch {
      // Organizer must never break SellCore.
    }
  };
}

export function installChronologicalArtificialOrganizer() {
  try {
    patchLocalStorageTracking();
    createOrganizerRecord("organizer_boot", "block_013_install");
    buildButton();
    console.info("[SellCore Block 013] Chronological Artificial Organizer installed.");
  } catch (error) {
    console.warn("[SellCore Block 013] Organizer failed safely:", error);
  }
}