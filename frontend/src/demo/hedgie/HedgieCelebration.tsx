import { useEffect, useRef, useState } from 'react';
import type { HedgieScene } from './scene';

interface HedgieCelebrationProps {
  readonly loadScene: () => Promise<HedgieScene | null>;
}

export function HedgieCelebration({ loadScene }: HedgieCelebrationProps) {
  const viewportRef = useRef<HTMLSpanElement>(null);
  const sceneRef = useRef<HedgieScene | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let cancelled = false;
    void loadScene()
      .then(async (scene) => {
        if (!scene || cancelled) return;
        await scene.ready;
        if (cancelled) return;
        scene.mount(viewport);
        sceneRef.current = scene;
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('failed');
      });

    return () => {
      cancelled = true;
      sceneRef.current = null;
    };
  }, [loadScene]);

  return (
    <div className="w-full max-w-[20rem] justify-self-center">
      <div className="relative z-10 mx-auto mb-1 w-fit rounded-2xl bg-[#ffcf45] px-4 py-2 text-sm font-bold text-[#211600] after:absolute after:-bottom-1 after:left-1/2 after:size-2.5 after:-translate-x-1/2 after:rotate-45 after:bg-inherit">
        Congratulations!
      </div>
      <button
        type="button"
        disabled={status !== 'ready'}
        onClick={() => sceneRef.current?.celebrate()}
        aria-label="Celebrate with Hedgie"
        className="peer block w-full cursor-pointer touch-manipulation rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffcf45] disabled:cursor-default"
      >
        <span
          aria-hidden="true"
          className="relative block aspect-[1.16] w-full bg-[radial-gradient(ellipse_at_center,#ffcf4526,transparent_68%)]"
        >
          <span
            ref={viewportRef}
            data-ready={status === 'ready'}
            className="absolute inset-0 block opacity-0 transition-opacity duration-700 ease-out data-[ready=true]:opacity-100 [&>canvas]:block [&>canvas]:size-full"
          />
        </span>
      </button>
      <div className="mb-3 text-xs text-foreground/70 peer-enabled:peer-hover:text-[#ffcf45]">
        {status === 'ready' ? (
          'Tap or click to celebrate'
        ) : (
          <span role="status">
            {status === 'loading' ? 'Loading Hedgie…' : 'Could not load Hedgie.'}
          </span>
        )}
      </div>
    </div>
  );
}
