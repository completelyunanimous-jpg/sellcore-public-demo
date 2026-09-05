/* Mobile Builder Agent Eyes — provider-agnostic visual/perception bridge. */
(function () {
  'use strict';
  const HISTORY_LIMIT = 120;
  const OBSERVE_MS = 100;
  const ACTION_HOLD_MS = 120;
  const history = [];
  const actionQueue = [];
  const heldKeys = new Set();
  let latest = null;
  let observationId = 0;
  let lastCaptureAt = 0;

  function now() { return Date.now(); }
  function keyEvent(type, key) {
    const event = new KeyboardEvent(type, { key, code: 'Key' + key.toUpperCase(), bubbles: true, cancelable: true });
    window.dispatchEvent(event);
  }
  function holdKey(key) {
    const k = String(key || '').toLowerCase();
    if (!['w', 'a', 's', 'd'].includes(k)) return false;
    if (!heldKeys.has(k)) { heldKeys.add(k); keyEvent('keydown', k); }
    window.setTimeout(() => {
      if (heldKeys.delete(k)) keyEvent('keyup', k);
    }, ACTION_HOLD_MS);
    return true;
  }
  function applyLook(dx, dy) {
    const x = Number(dx) || 0;
    const y = Number(dy) || 0;
    if (!x && !y) return true;
    const event = new MouseEvent('mousemove', { bubbles: true, cancelable: true, buttons: 1, movementX: x, movementY: y });
    window.dispatchEvent(event);
    return true;
  }
  function applyMove(x, y) {
    const mx = Math.max(-1, Math.min(1, Number(x) || 0));
    const my = Math.max(-1, Math.min(1, Number(y) || 0));
    if (my > 0.12) holdKey('w');
    else if (my < -0.12) holdKey('s');
    if (mx > 0.12) holdKey('d');
    else if (mx < -0.12) holdKey('a');
    return true;
  }
  function safeCapture() {
    const source = window.MobileBuilderObserver;
    if (!source || typeof source.capture !== 'function') return null;
    try { return source.capture(); } catch (error) {
      return { type: 'mobile-builder-observation-error', timestamp: now(), error: String(error && error.message || error) };
    }
  }
  function emit(observation) {
    window.dispatchEvent(new CustomEvent('mobile-builder-observation', { detail: observation }));
  }
  function publish(force) {
    const t = now();
    if (!force && t - lastCaptureAt < OBSERVE_MS) return latest;
    const base = safeCapture();
    if (!base) return latest;
    lastCaptureAt = t;
    const visual = base.frame ? {
      format: 'data-url',
      encoding: 'image/jpeg',
      data: base.frame,
      width: base.viewport && base.viewport.width || 0,
      height: base.viewport && base.viewport.height || 0
    } : null;
    const observation = Object.assign({}, base, {
      schema: 'mobile-builder-agent-eyes/v1',
      observationId: ++observationId,
      capturedAt: t,
      renderedAtObservation: true,
      visual,
      perception: {
        cameraPose: base.camera || null,
        playerPose: base.player || null,
        environment: base.environment || null,
        renderer: base.renderer || 'unknown'
      },
      actionInterface: {
        supported: ['move', 'look', 'key'],
        queueDepth: actionQueue.length
      }
    });
    delete observation.frame;
    latest = observation;
    history.push(observation);
    while (history.length > HISTORY_LIMIT) history.shift();
    emit(observation);
    return observation;
  }

  window.MobileBuilderRuntime = {
    version: 2,
    schema: 'mobile-builder-agent-eyes/v1',
    isLive: () => true,
    observe: (force) => publish(force !== false),
    getLatest: () => latest,
    getHistory: () => history.slice(),
    enqueueAction: (action) => {
      if (!action || typeof action !== 'object') return false;
      actionQueue.push(Object.assign({}, action, { queuedAt: now() }));
      return true;
    },
    drainActions: () => actionQueue.splice(0, actionQueue.length),
    applyAction: (action) => {
      if (!action || typeof action !== 'object') return false;
      if (action.type === 'look') return applyLook(action.dx, action.dy);
      if (action.type === 'move') return applyMove(action.x, action.y);
      if (action.type === 'key') {
        const k = String(action.key || '').toLowerCase();
        if (!['w', 'a', 's', 'd'].includes(k)) return false;
        if (action.down === false) { if (heldKeys.delete(k)) keyEvent('keyup', k); return true; }
        return holdKey(k);
      }
      return false;
    },
    step: (actions) => {
      const list = Array.isArray(actions) ? actions : window.MobileBuilderRuntime.drainActions();
      let applied = 0;
      for (const action of list) if (window.MobileBuilderRuntime.applyAction(action)) applied++;
      return { applied, observation: publish(true) };
    }
  };

  function tick() {
    try {
      const queued = window.MobileBuilderRuntime.drainActions();
      if (queued.length) for (const action of queued) window.MobileBuilderRuntime.applyAction(action);
      publish(false);
    } catch (error) {
      console.warn('Mobile Builder Agent Eyes tick', error);
    }
    requestAnimationFrame(tick);
  }

  function announceReady() {
    window.dispatchEvent(new CustomEvent('mobile-builder-agent-ready', {
      detail: { version: 2, schema: 'mobile-builder-agent-eyes/v1', timestamp: now() }
    }));
    publish(true);
  }

  requestAnimationFrame(() => { announceReady(); tick(); });
})();
