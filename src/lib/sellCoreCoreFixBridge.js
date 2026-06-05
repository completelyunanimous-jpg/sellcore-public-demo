import { recordSellCoreAction } from "./sellcoreActionControlCenter.js";

const BRIDGE_KEY = "sellcore_corefix_bridge_v018";

function safeRead(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readSellCoreCoreFixBridge() {
  return safeRead(BRIDGE_KEY, {
    block: "018",
    status: "ready",
    events: []
  });
}

export function recordCoreFixBridgeEvent(type, payload = {}) {
  const bridge = readSellCoreCoreFixBridge();

  const event = {
    id: crypto.randomUUID ? crypto.randomUUID() : "bridge-" + Date.now(),
    type,
    payload,
    createdAt: new Date().toISOString()
  };

  const updated = {
    ...bridge,
    status: "active",
    lastEventAt: event.createdAt,
    events: [event].concat(bridge.events || []).slice(0, 100)
  };

  safeWrite(BRIDGE_KEY, updated);

  recordSellCoreAction(type, {
    bridgeBlock: "018",
    ...payload
  });

  return event;
}

export function installSellCoreCoreFixBridge() {
  const bridge = readSellCoreCoreFixBridge();

  safeWrite(BRIDGE_KEY, {
    ...bridge,
    block: "018",
    status: "active",
    installedAt: bridge.installedAt || new Date().toISOString()
  });

  recordCoreFixBridgeEvent("corefix_bridge_started", {
    message: "CoreFix bridge connected to Action Control Center"
  });

  window.sellCoreCoreFixBridge = {
    read: readSellCoreCoreFixBridge,
    record: recordCoreFixBridgeEvent
  };

  return true;
}
