import { Coins01Icon, FastForwardIcon, RefreshIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DemoToolbarProps {
  readonly completedCount: number;
  readonly totalCount: number;
  readonly firstUnfinishedTopicTitle: string | null;
  readonly onCompleteCurrentTopic: () => void;
  readonly onReset: () => void;
}

export function DemoToolbar({
  completedCount,
  totalCount,
  firstUnfinishedTopicTitle,
  onCompleteCurrentTopic,
  onReset,
}: DemoToolbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-3 lg:max-w-7xl lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-base font-semibold tracking-tight text-foreground">
            Course progress
          </h1>

          <Badge
            variant="outline"
            aria-label={`${completedCount} of ${totalCount} completed`}
            className="gap-2 border border-border bg-secondary px-3 py-1 text-lg tracking-normal tabular-nums"
          >
            <span>
              {completedCount}/{totalCount}
            </span>
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#ffd22e] text-[#07090a]">
              <HugeiconsIcon icon={Coins01Icon} className="size-4!" strokeWidth={2.4} />
            </span>
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={firstUnfinishedTopicTitle === null}
            onClick={onCompleteCurrentTopic}
            className="min-w-0 flex-1 transition-transform active:scale-95 lg:flex-none"
          >
            <HugeiconsIcon icon={FastForwardIcon} strokeWidth={2} />
            <span className="truncate">
              {firstUnfinishedTopicTitle !== null ? `Complete ${firstUnfinishedTopicTitle}` : 'All done'}
            </span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onReset}
            className="transition-transform active:scale-95"
          >
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
            Reset
          </Button>
        </div>
      </div>
    </header>
  );
}
