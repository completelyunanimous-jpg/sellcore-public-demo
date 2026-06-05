import { createProofPack } from "./proofPackContract.js";
import { recordSellCoreAction } from "./sellcoreActionControlCenter.js";

// ProofPack automatic direct force insert shell.
// Term 4 replacement lane.
// This addon inserts a ProofPack into listing objects before storage.
// No async. No crypto. No healer. No rewrite.

const AUTO_INSERT_KEY = "sellcore:proofpack:auto-insert";

function fallbackConfig() {
  return {
    enabled: true,
    forceInsert: true,
    overwriteExisting: false,
    logEveryInsert: true
  };
}

function readConfig() {
  try {
    const stored = localStorage.getItem(AUTO_INSERT_KEY);
    if (!stored) return fallbackConfig();

    const parsed = JSON.parse(stored);
    return {
      ...fallbackConfig(),
      ...(parsed && typeof parsed === "object" ? parsed : {})
    };
  } catch {
    return fallbackConfig();
  }
}

function writeConfig(config) {
  localStorage.setItem(AUTO_INSERT_KEY, JSON.stringify({
    ...fallbackConfig(),
    ...(config && typeof config === "object" ? config : {})
  }));
}

function isListingLike(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    value.id &&
    Object.prototype.hasOwnProperty.call(value, "title")
  );
}

function hasProofPack(listing) {
  return Boolean(
    listing &&
    listing.proofPack &&
    listing.proofPack.proofPackVersion
  );
}

function markInserted(listing) {
  listing._proofPackInserted = true;
  listing._proofPackInsertedAt = new Date().toISOString();
  return listing;
}

export function forceInsertProofPack(listing = {}) {
  const config = readConfig();
  if (!config.enabled) return listing;
  if (!listing || typeof listing !== "object") return listing;

  if (hasProofPack(listing) && !config.overwriteExisting) {
    return listing;
  }

  const proofPack = createProofPack(listing);
  listing.proofPack = proofPack;
  markInserted(listing);

  if (config.logEveryInsert) {
    recordSellCoreAction("proofpack_auto_inserted", {
      listingId: listing.id || null,
      proofPackVersion: proofPack.proofPackVersion,
      verificationStatus: proofPack.verificationStatus,
      forceInsert: true
    });
  }

  return listing;
}

export function scanAndFixMissingProofPacks() {
  const config = readConfig();
  if (!config.enabled) return { scanned: 0, fixed: 0 };

  let fixed = 0;
  let scanned = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        let changed = false;

        for (let j = 0; j < parsed.length; j++) {
          const item = parsed[j];

          if (isListingLike(item)) {
            scanned++;

            if (!hasProofPack(item)) {
              item.proofPack = createProofPack(item);
              markInserted(item);
              fixed++;
              changed = true;
            }
          }
        }

        if (changed) {
          localStorage.setItem(key, JSON.stringify(parsed));
        }
      } else if (isListingLike(parsed)) {
        scanned++;

        if (!hasProofPack(parsed)) {
          parsed.proofPack = createProofPack(parsed);
          markInserted(parsed);
          localStorage.setItem(key, JSON.stringify(parsed));
          fixed++;
        }
      }
    } catch {
      // Skip entries that are not JSON.
    }
  }

  recordSellCoreAction("proofpack_scan_complete", {
    scanned,
    fixed,
    timestamp: new Date().toISOString()
  });

  return { scanned, fixed };
}

export function autoInsertOnCreate(listing = {}) {
  return forceInsertProofPack(listing);
}

export function autoInsertBatch(listings = []) {
  return listings.map((listing) => forceInsertProofPack(listing));
}

export function enableAutoInsert() {
  const config = readConfig();
  config.enabled = true;
  writeConfig(config);
  recordSellCoreAction("proofpack_auto_insert_enabled", {});
}

export function disableAutoInsert() {
  const config = readConfig();
  config.enabled = false;
  writeConfig(config);
  recordSellCoreAction("proofpack_auto_insert_disabled", {});
}

export function getAutoInsertConfig() {
  return readConfig();
}

export function installProofPackAutoInsert() {
  try {
    if (!localStorage.getItem(AUTO_INSERT_KEY)) {
      writeConfig(fallbackConfig());
    }

    setTimeout(() => {
      const result = scanAndFixMissingProofPacks();

      if (result.fixed > 0) {
        console.info(`[ProofPackAutoInsert] Fixed ${result.fixed} listings missing ProofPacks`);
      }
    }, 1000);

    recordSellCoreAction("proofpack_auto_insert_installed", {
      version: "term4-force-insert-shell"
    });

    console.info("[ProofPackAutoInsert] Term 4 direct force insert shell active");
    return true;
  } catch (error) {
    console.warn("[ProofPackAutoInsert] Install failed safely:", error);
    return false;
  }
}