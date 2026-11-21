import { useCallback, useEffect, useRef } from 'react';
import type { HedgieScene } from './scene';

function requestHedgieScene() {
  let scene: HedgieScene | undefined;
  let cancelled = false;
  let resolveUnavailable: () => void;
  const unavailable = new Promise<null>((resolve) => {
    resolveUnavailable = () => resolve(null);
  });

  function dispose() {
    cancelled = true;
    window.clearTimeout(timeout);
    resolveUnavailable();
    scene?.dispose();
  }

  const timeout = window.setTimeout(() => {
    console.warn('Hedgie 3D timed out while loading.');
    dispose();
  }, 4000);

  const load = import('./scene.js')
    .then(async ({ prepareHedgieScene }) => {
      if (cancelled) return null;
      scene = prepareHedgieScene();
      scene.signal.addEventListener('abort', () => {
        window.clearTimeout(timeout);
        resolveUnavailable();
      }, { once: true });
      await scene.ready;
      return scene.signal.aborted ? null : scene;
    })
    .catch((error: unknown) => {
      if (!cancelled) console.warn('Could not load Hedgie 3D.', error);
      dispose();
      return null;
    })
    .finally(() => window.clearTimeout(timeout));

  return { ready: Promise.race([load, unavailable]), dispose };
}

export function useHedgieScene(enabled: boolean) {
  const sceneRequest = useRef<ReturnType<typeof requestHedgieScene> | null>(null);

  const loadScene = useCallback(() => {
    if (!sceneRequest.current) {
      sceneRequest.current = requestHedgieScene();
    }
    return sceneRequest.current.ready;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Let the lesson entrance animation finish before loading the 3D bundle.
    const preloadTimer = window.setTimeout(() => {
      void loadScene();
    }, 400);

    return () => {
      window.clearTimeout(preloadTimer);
      sceneRequest.current?.dispose();
      sceneRequest.current = null;
    };
  }, [enabled, loadScene]);

  return loadScene;
}
