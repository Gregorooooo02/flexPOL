import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, RefObject } from 'react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { hedgieImage } from './hedgie';
import type { IdleHedgieScene } from './idleHedgieScene';

interface Position {
  readonly x: number;
  readonly y: number;
}

interface Drag {
  readonly pointerId: number;
  readonly origin: Position;
  readonly start: Position;
  moved: boolean;
}

const KEY_STEPS: Record<string, Position> = {
  ArrowLeft: { x: -20, y: 0 },
  ArrowRight: { x: 20, y: 0 },
  ArrowUp: { x: 0, y: -20 },
  ArrowDown: { x: 0, y: 20 },
};

interface CoachLauncherProps {
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
  readonly desktop: boolean;
  readonly chatOpen: boolean;
  readonly onOpen: () => void;
}

export function CoachLauncher({ buttonRef, desktop, chatOpen, onOpen }: CoachLauncherProps) {
  const viewportRef = useRef<HTMLSpanElement>(null);
  const drag = useRef<Drag | null>(null);
  const suppressPointerClick = useRef(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [dragging, setDragging] = useState(false);
  const [scene, setScene] = useState<IdleHedgieScene | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    let cancelled = false;
    let mountedScene: IdleHedgieScene | undefined;

    void import('./idleHedgieScene.js').then(({ mountIdleHedgie }) => {
      if (cancelled) return;
      mountedScene = mountIdleHedgie(viewport, () => {
        mountedScene = undefined;
        setScene(null);
      });
      setScene(mountedScene);
    }).catch(() => {
      // Keep the greeting illustration when WebGL is unavailable.
    });

    return () => {
      cancelled = true;
      mountedScene?.dispose();
    };
  }, []);

  useEffect(() => {
    scene?.setActive(!chatOpen);
  }, [chatOpen, scene]);

  function move(button: HTMLButtonElement, x: number, y: number) {
    const bounds = button.offsetParent;
    if (!(bounds instanceof HTMLElement)) return;
    setPosition({
      x: Math.max(0, Math.min(x, bounds.clientWidth - button.offsetWidth)),
      y: Math.max(0, Math.min(y, bounds.clientHeight - button.offsetHeight)),
    });
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0 || drag.current) return;
    const button = event.currentTarget;
    suppressPointerClick.current = false;
    drag.current = {
      pointerId: event.pointerId,
      origin: { x: button.offsetLeft, y: button.offsetTop },
      start: { x: event.clientX, y: event.clientY },
      moved: false,
    };
    button.setPointerCapture(event.pointerId);
  }

  function updateDrag(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const dx = event.clientX - active.start.x;
    const dy = event.clientY - active.start.y;
    if (!active.moved) {
      if (Math.hypot(dx, dy) < 6) return;
      active.moved = true;
      suppressPointerClick.current = true;
      setDragging(true);
    }
    move(event.currentTarget, active.origin.x + dx, active.origin.y + dy);
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!Object.hasOwn(KEY_STEPS, event.key)) return;
    event.preventDefault();
    const button = event.currentTarget;
    const step = KEY_STEPS[event.key];
    move(button, button.offsetLeft + step.x, button.offsetTop + step.y);
  }

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Ask Hedgie"
      aria-description="Drag Hedgie or use the arrow keys to move."
      aria-haspopup={desktop ? undefined : 'dialog'}
      aria-expanded={desktop ? chatOpen : undefined}
      aria-controls={desktop ? 'coach-sidebar' : undefined}
      inert={chatOpen}
      title="Ask Hedgie · Drag to move"
      className={cn(
        'absolute z-40 size-(--hedgie-size) max-h-full max-w-full touch-none rounded-full [--hedgie-size:6rem] lg:[--hedgie-size:8rem]',
        'transition-[opacity,scale,translate] hover:bg-transparent active:not-aria-[haspopup]:translate-y-0 motion-reduce:transition-none',
        chatOpen
          ? 'pointer-events-none translate-y-2 scale-90 opacity-0 duration-200 ease-in'
          : 'translate-y-0 scale-100 opacity-100 duration-[320ms] ease-out',
        dragging ? 'cursor-grabbing' : 'cursor-grab',
        !position && 'right-4 bottom-4 group-has-[[data-coach-footer]]/coach:bottom-[min(8rem,25%)]',
      )}
      style={position ? {
        left: `clamp(0px, ${position.x}px, calc(100% - var(--hedgie-size)))`,
        top: `clamp(0px, ${position.y}px, calc(100% - var(--hedgie-size)))`,
      } : undefined}
      onPointerDown={startDrag}
      onPointerMove={updateDrag}
      onPointerUp={(event) => {
        updateDrag(event);
        endDrag(event);
      }}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onKeyDown={handleKeyDown}
      onClick={(event) => {
        if (event.detail > 0 && suppressPointerClick.current) {
          suppressPointerClick.current = false;
          return;
        }
        onOpen();
      }}
    >
      <span
        ref={viewportRef}
        aria-hidden="true"
        data-dragging={dragging}
        className="pointer-events-none absolute inset-0 [&>canvas]:block [&>canvas]:size-full"
      />
      {!scene && (
        <img src={hedgieImage('greeting')} alt="" draggable={false} className="pointer-events-none size-4/5" />
      )}
    </Button>
  );
}
