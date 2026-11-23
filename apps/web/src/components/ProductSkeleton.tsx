import { Skeleton } from '@/components/ui/skeleton';

export function ProductSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm">
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      <div className="flex flex-col gap-2 px-1 pb-1">
        <Skeleton className="h-3 w-[64%]" />
        <Skeleton className="h-7 w-full" />
        <Skeleton className="mt-1 h-3 w-[36%]" />
      </div>
    </div>
  );
}
