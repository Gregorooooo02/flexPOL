import { cn } from 'cn';

const STAR_PATH =
  'M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z';

/** Filled and empty stars, read as one image: "4 of 5 stars". */
export function StarRating({
  stars,
  max = 5,
  size = 'md',
  className,
}: {
  stars: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClass = size === 'lg' ? 'size-9 sm:size-10' : size === 'sm' ? 'size-3.5' : 'size-5';
  return (
    <span role="img" aria-label={`${stars} of ${max} stars`} className={cn('inline-flex items-center gap-1', className)}>
      {Array.from({ length: max }, (_, index) => {
        const filled = index < stars;
        return (
          <svg
            key={index}
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={cn(sizeClass, 'shrink-0', filled ? 'text-primary' : 'text-muted-foreground/40')}
          >
            <path
              d={STAR_PATH}
              fill={filled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </span>
  );
}
