import { useEffect, useRef, useState } from 'react';
import { cn } from 'cn';
import type { HedgieReaction, HedgieScene } from './scene';

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
  const reaction = REACTIONS[reactionIndex % REACTIONS.length] ?? REACTIONS[0];
  const fromLeft = reactionIndex % 2 === 1;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let cancelled = false;
    let unmountScene: (() => void) | undefined;

    void loadScene()
      .then(async (scene) => {
        if (!scene || cancelled) return;
        await scene.ready;
        if (cancelled) return;

        unmountScene = scene.mount(viewport, {
          gesture: reaction.gesture,
          reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          onSpeech: setSpeaking,
        });
      })
      .catch(() => unmountScene?.());

    return () => {
      cancelled = true;
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
