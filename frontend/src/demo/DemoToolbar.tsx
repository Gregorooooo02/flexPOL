import {
  Cancel01Icon,
  Coins01Icon,
  FastForwardIcon,
  RefreshIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';

export interface DemoBanner {
  readonly tone: 'neutral' | 'gold' | 'locked';
  readonly message: string;
}

interface DemoToolbarProps {
  readonly completedCount: number;
  readonly totalCount: number;
  readonly firstUnfinishedTopicTitle: string | null;
  readonly banner: DemoBanner | null;
  readonly onCompleteCurrentTopic: () => void;
  readonly onReset: () => void;
  readonly onDismissBanner: () => void;
}

export function DemoToolbar({
  completedCount,
  totalCount,
  firstUnfinishedTopicTitle,
  banner,
  onCompleteCurrentTopic,
  onReset,
  onDismissBanner,
}: DemoToolbarProps) {
  return (
    <aside
      aria-label="Course progress and controls"
      className="pointer-events-none absolute bottom-4 left-4 z-30 flex max-w-[calc(100%-2rem)] flex-col items-start gap-2 sm:max-w-sm coach-sidebar:max-w-[min(24rem,calc(100%-10rem))]"
    >
      <div
        role="status"
        aria-live="polite"
        className={cn('pointer-events-auto w-full', !banner && 'hidden')}
      >
        {banner && (
          <div
            className={cn(
              'flex items-start gap-2.5 border px-3 py-2 text-xs leading-snug shadow-md backdrop-blur-md transition-colors sm:text-sm',
              banner.tone === 'gold'
                ? 'border-[#e17101] bg-card/95 text-foreground'
                : banner.tone === 'locked'
                  ? 'border-[#ba4d00] bg-card/95 text-foreground'
                  : 'border-border bg-card/95 text-foreground',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'mt-1.5 size-2 shrink-0 rounded-full',
                banner.tone === 'gold'
                  ? 'bg-[#efb100]'
                  : banner.tone === 'locked'
                    ? 'bg-[#ba4d00]'
                    : 'bg-primary',
              )}
            />
            <span className="min-w-0 flex-1">{banner.message}</span>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label="Dismiss notification"
              onClick={onDismissBanner}
              className="-mt-0.5 -mr-1 shrink-0"
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </Button>
          </div>
        )}
      </div>

      <div className="pointer-events-auto flex flex-wrap items-center gap-2 border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur-md">
        <div
          aria-label={`Course progress: ${completedCount} of ${totalCount} completed`}
          title="Course progress"
          className="flex items-center gap-2 bg-secondary px-2.5 py-1 text-sm font-semibold tabular-nums"
        >
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#ffd22e] text-[#07090a]">
            <HugeiconsIcon icon={Coins01Icon} className="size-3.5!" strokeWidth={2.4} />
          </span>
          <span>
            {completedCount}
            <span className="text-muted-foreground">/{totalCount}</span>
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-1">
          <Button
            type="button"
            size="xs"
            variant="secondary"
            disabled={firstUnfinishedTopicTitle === null}
            onClick={onCompleteCurrentTopic}
            className="max-w-44 truncate transition-transform active:scale-95"
          >
            <HugeiconsIcon icon={FastForwardIcon} strokeWidth={2} />
            <span className="truncate">
              {firstUnfinishedTopicTitle !== null ? `Complete ${firstUnfinishedTopicTitle}` : 'All done'}
            </span>
          </Button>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            aria-label="Reset progress"
            title="Reset progress"
            onClick={onReset}
            className="px-2 transition-transform active:scale-95"
          >
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
            <span className="sr-only sm:not-sr-only">Reset</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
