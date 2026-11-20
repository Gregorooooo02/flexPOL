import { useCallback, useEffect, useRef } from 'react';
import type { HedgieScene } from './scene';

function waitForIdle() {
  return new Promise<void>((resolve) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => resolve(), { timeout: 500 });
    } else {
      window.setTimeout(resolve, 50);
    }
  });
}

export function useHedgieScene(enabled: boolean) {
  const sceneRequest = useRef<Promise<HedgieScene | null> | null>(null);

  const loadScene = useCallback(() => {
    if (!sceneRequest.current) {
      const request: Promise<HedgieScene | null> = import('./scene.js').then(async ({ prepareHedgieScene }) => {
        await waitForIdle();
        return sceneRequest.current === request ? prepareHedgieScene() : null;
      });
      sceneRequest.current = request;
    }
    return sceneRequest.current;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Let the lesson entrance animation finish before loading the 3D bundle.
    const preloadTimer = window.setTimeout(() => {
      void loadScene().then((scene) => scene?.ready).catch(() => {
        // The completion screen reports loading errors.
      });
    }, 400);

    return () => {
      window.clearTimeout(preloadTimer);
      const request = sceneRequest.current;
      sceneRequest.current = null;
      void request?.then((scene) => scene?.dispose(), () => {});
    };
  }, [enabled, loadScene]);

  return loadScene;
}
