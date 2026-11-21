import { useEffect, useRef, useState } from 'react';
import { hedgieImage } from '@/components/coach/hedgie';
import type { HedgieScene } from './scene';

interface HedgieCelebrationProps {
  readonly loadScene: () => Promise<HedgieScene | null>;
}

export function HedgieCelebration({ loadScene }: HedgieCelebrationProps) {
  const viewportRef = useRef<HTMLSpanElement>(null);
  const sceneRef = useRef<HedgieScene | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const listeners = new AbortController();
    let unmountScene: (() => void) | undefined;
    void loadScene()
      .then((scene) => {
        if (!scene || scene.signal.aborted || listeners.signal.aborted) return;
        unmountScene = scene.mount(viewport);
        sceneRef.current = scene;
        setReady(true);
        scene.signal.addEventListener('abort', () => {
          sceneRef.current = null;
          setReady(false);
        }, { signal: listeners.signal });
      })
      .catch((error: unknown) => {
        console.warn('Could not show Hedgie’s 3D celebration.', error);
      });

    return () => {
      listeners.abort();
      unmountScene?.();
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
        disabled={!ready}
        onClick={() => sceneRef.current?.celebrate()}
        aria-label="Celebrate with Hedgie"
        className="peer block w-full cursor-pointer touch-manipulation rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffcf45] disabled:cursor-default"
      >
        <span
          aria-hidden="true"
          className="relative block aspect-[1.16] w-full bg-[radial-gradient(ellipse_at_center,#ffcf4526,transparent_68%)]"
        >
          <img
            src={hedgieImage('joy')}
            alt=""
            data-ready={ready}
            className="absolute inset-0 m-auto size-3/4 object-contain data-[ready=true]:opacity-0 motion-safe:duration-700 motion-safe:data-[ready=true]:transition-opacity"
          />
          <span
            ref={viewportRef}
            data-ready={ready}
            className="absolute inset-0 block opacity-0 data-[ready=true]:opacity-100 motion-safe:transition-opacity motion-safe:duration-700 motion-safe:ease-out [&>canvas]:block [&>canvas]:size-full"
          />
        </span>
      </button>
      <div className="mb-3 min-h-4 text-xs text-foreground/70 peer-enabled:peer-hover:text-[#9a6a00] dark:peer-enabled:peer-hover:text-[#ffcf45]">
        {ready && 'Tap or click to celebrate'}
      </div>
    </div>
  );
}
