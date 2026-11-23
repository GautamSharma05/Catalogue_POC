import { cn } from '@/lib/utils';

interface StarRatingProps {
  rate: number;
  count: number;
}

const STAR_PATH =
  'M10 1.5c.5 0 1 .3 1.2.9l1.6 4.8h5.1c.5 0 1 .4 1.1.9.1.5-.1 1-.6 1.3L14 11l1.6 4.8c.2.5 0 1-.4 1.3-.3.3-.9.3-1.3 0l-4.9-3.6-4.9 3.6c-.4.3-1 .3-1.3 0-.4-.3-.6-.8-.4-1.3l1.6-4.8-3.9-2.8c-.5-.3-.7-.8-.6-1.3.1-.5.6-.9 1.1-.9h5.1l1.6-4.8c.2-.6.7-.9 1.2-.9Z';

export function StarRating({ rate, count }: StarRatingProps) {
  const full = Math.floor(rate);
  const partial = rate - full;

  return (
    <div
      className="flex items-center gap-1 text-star"
      title={`Rated ${rate} out of 5 (${count} reviews)`}
      role="img"
      aria-label={`Rated ${rate} out of 5 based on ${count} reviews`}
    >
      {[...Array(5)].map((_, i) => {
        const isFull = i < full;
        const isPartial = i === full && partial > 0;
        return (
          <svg
            key={i}
            viewBox="0 0 20 20"
            className={cn('size-3.5', isFull || isPartial ? 'text-star' : 'text-muted-foreground/40')}
          >
            <path fill="currentColor" d={STAR_PATH} />
          </svg>
        );
      })}
      {count > 0 && <span className="text-xs text-muted-foreground">({count})</span>}
    </div>
  );
}
