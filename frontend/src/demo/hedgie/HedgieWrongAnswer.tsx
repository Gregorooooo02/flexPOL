import { useEffect, useRef, useState } from 'react';
import { cn } from 'cn';
import { hedgieImage } from '@/components/coach/hedgie';
import type { HedgieReaction, HedgieScene } from './scene';

const FALLBACK_DURATION_MS = 2100;

const REACTIONS = [
  { gesture: 'glance', speech: 'Hmm… tricky.', placement: 'top-[73svh] lg:top-[46%]' },
  { gesture: 'shake', speech: 'Not quite!', placement: 'top-[43svh] lg:top-[53%]' },
  { gesture: 'huff', speech: 'Oof!', placement: 'top-[58svh] lg:top-[49%]' },
] as const satisfies readonly {
  gesture: HedgieReaction['gesture'];
  speech: string;
  placement: string;
}[];

export function HedgieWrongAnswer({ reactionIndex, loadScene }: {
  readonly reactionIndex: number;
  readonly loadScene: () => Promise<HedgieScene | null>;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [speaking, setSpeaking] = useState(false);
  const [fallback, setFallback] = useState(false);
  const reaction = REACTIONS[reactionIndex % REACTIONS.length] ?? REACTIONS[0];
  const fromLeft = reactionIndex % 2 === 1;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const listeners = new AbortController();
    let unmountScene: (() => void) | undefined;
    let hideTimer: number | undefined;

    function showFallback() {
      if (listeners.signal.aborted) return;
      listeners.abort();
      window.clearTimeout(loadTimer);
      unmountScene?.();
      setSpeaking(true);
      setFallback(true);
      hideTimer = window.setTimeout(() => {
        setSpeaking(false);
        setFallback(false);
      }, FALLBACK_DURATION_MS);
    }

    const loadTimer = window.setTimeout(showFallback, 650);

    void loadScene()
      .then((scene) => {
        if (listeners.signal.aborted) return;
        if (!scene || scene.signal.aborted) {
          showFallback();
          return;
        }

        unmountScene = scene.mount(viewport, {
          gesture: reaction.gesture,
          reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          onSpeech: setSpeaking,
          onFinish: () => listeners.abort(),
        });
        window.clearTimeout(loadTimer);
        scene.signal.addEventListener('abort', showFallback, { signal: listeners.signal });
      })
      .catch((error: unknown) => {
        console.warn('Could not show Hedgie’s 3D reaction.', error);
        showFallback();
      });

    return () => {
      listeners.abort();
      window.clearTimeout(loadTimer);
      window.clearTimeout(hideTimer);
      unmountScene?.();
    };
  }, [loadScene, reaction.gesture]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed z-10 w-[clamp(8.5rem,19vw,16rem)] -translate-y-1/2',
        fromLeft ? 'left-0' : 'right-0',
        reaction.placement,
      )}
    >
      <div
        ref={viewportRef}
        className="aspect-square w-full [&>canvas]:block [&>canvas]:size-full"
        style={fromLeft ? { transform: 'scaleX(-1)' } : undefined}
      />
      {fallback && (
        <div className="absolute inset-0 overflow-hidden" style={fromLeft ? { transform: 'scaleX(-1)' } : undefined}>
          <img
            src={hedgieImage('encouragement')}
            alt=""
            className="absolute right-0 top-[8%] size-3/4 object-contain motion-safe:animate-[hedgie-peek_ease-in-out_both]"
            style={{ animationDuration: `${FALLBACK_DURATION_MS}ms` }}
          />
        </div>
      )}
      {speaking && (
        <div
          className={cn(
            'absolute top-[60%] w-max -translate-y-1/2 rounded-[0.65rem] border border-primary/45 bg-card px-3 py-1.5 text-xs font-semibold text-card-foreground shadow-sm after:absolute after:top-1/2 after:size-1.5 after:-translate-y-1/2 after:rotate-45 after:border-current after:bg-card after:text-primary/45 motion-safe:animate-in motion-safe:fade-in-0 lg:top-[68%]',
            fromLeft
              ? 'left-[43%] after:-left-1 after:border-b after:border-l'
              : 'right-[43%] after:-right-1 after:border-t after:border-r',
          )}
        >
          {reaction.speech}
        </div>
      )}
    </div>
  );
}
