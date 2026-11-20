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
    <header className="sticky top-[var(--app-header-height)] z-20 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-4 py-3 lg:max-w-7xl lg:flex-row lg:items-center lg:gap-8">
        <div className="flex items-center justify-between gap-2 lg:flex-1">
          <h1 className="font-heading text-base font-semibold tracking-tight text-foreground">
            Course progress
          </h1>

          <Badge
            variant="outline"
            className="gap-1.5 border border-border bg-secondary px-2 py-0.5 tabular-nums"
          >
            <span>
              {completedCount}/{totalCount}
            </span>
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#ffd22e] text-[#07090a]">
              <HugeiconsIcon icon={Coins01Icon} className="size-3!" strokeWidth={2.4} />
            </span>
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2 lg:w-96">
          <Button
            type="button"
            size="xs"
            variant="secondary"
            disabled={firstUnfinishedTopicTitle === null}
            onClick={onCompleteCurrentTopic}
            className="flex-1 transition-transform active:scale-95 lg:flex-none"
          >
            <HugeiconsIcon icon={FastForwardIcon} strokeWidth={2} />
            {firstUnfinishedTopicTitle !== null ? `Complete ${firstUnfinishedTopicTitle}` : 'All done'}
          </Button>
          <Button
            type="button"
            size="xs"
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
