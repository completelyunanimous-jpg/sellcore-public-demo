const ACTION_KEY = "sellcore_action_control_center_v019";
const MAX_ACTIONS = 250;

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

export function readActionControlCenter() {
  return safeRead(ACTION_KEY, []);
}

export function resolveAutomationSignal(type) {
  const signals = {
    listing_created: "scan_listing_for_trust",
    item_saved: "update_interest_memory",
    profile_updated: "refresh_seller_identity",
    media_added: "verify_media_attachment",
    export_triggered: "prepare_backup_package",
    corefix_opened: "developer_support_signal"
  };

  return signals[type] || "general_activity_log";
}

export function recordSellCoreAction(type, payload = {}) {
  const actions = readActionControlCenter();

  const action = {
    id: crypto.randomUUID ? crypto.randomUUID() : `action-${Date.now()}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
    status: "queued",
    automationSignal: resolveAutomationSignal(type)
  };

  safeWrite(ACTION_KEY, [action, ...actions].slice(0, MAX_ACTIONS));
  return action;
}

export function processQueuedActions() {
  const actions = readActionControlCenter();

  const processed = actions.map((action) => {
    if (action.status !== "queued") return action;

    return {
      ...action,
      status: "processed",
      processedAt: new Date().toISOString()
    };
  });

  safeWrite(ACTION_KEY, processed);
  return processed;
}

export function flushActionControlCenter() {
  localStorage.removeItem(ACTION_KEY);
}
