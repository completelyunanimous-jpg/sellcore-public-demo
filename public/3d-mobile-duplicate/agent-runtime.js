/* Mobile Builder Agent Eyes — provider-agnostic visual/perception bridge. */
(function () {
  'use strict';
  const HISTORY_LIMIT = 120;
  const OBSERVE_MS = 100;
  const history = [];
  let latest = null;
  let observationId = 0;
  let lastCaptureAt = 0;
  const actionQueue = [];

  function now() { return Date.now(); }
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
    const observation = Object.assign({}, base, {
      schema: 'mobile-builder-agent-eyes/v1',
      observationId: ++observationId,
      capturedAt: t,
      renderTick: observationId,
      visual: base.frame ? {
        format: 'data-url',
        encoding: 'image/jpeg',
        data: base.frame,
        width: base.viewport && base.viewport.width || 0,
        height: base.viewport && base.viewport.height || 0
      } : null,
      perception: {
        cameraPose: base.camera || null,
        playerPose: base.player || null,
        environment: base.environment || null,
        renderer: base.renderer || 'unknown'
      },
      pendingActions: actionQueue.length
    });
    delete observation.frame;
    latest = observation;
    history.push(observation);
    while (history.length > HISTORY_LIMIT) history.shift();
    emit(observation);
    return observation;
  }

  window.MobileBuilderRuntime = {
    version: 1,
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
      if (action.type === 'look' && window.MobileBuilderObserver && typeof window.MobileBuilderObserver.look === 'function') {
        window.MobileBuilderObserver.look(Number(action.dx) || 0, Number(action.dy) || 0);
        return true;
      }
      if (action.type === 'move' && window.MobileBuilderObserver && typeof window.MobileBuilderObserver.move === 'function') {
        window.MobileBuilderObserver.move(Number(action.x) || 0, Number(action.y) || 0);
        return true;
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
      detail: { version: 1, schema: 'mobile-builder-agent-eyes/v1', timestamp: now() }
    }));
    publish(true);
  }

  requestAnimationFrame(() => { announceReady(); tick(); });
})();
