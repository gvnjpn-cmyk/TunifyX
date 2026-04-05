import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded bg-spotify-card', className)} />
  )
}

export function TrackCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md">
      <Skeleton className="w-12 h-12 shrink-0 rounded" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="w-10 h-3" />
    </div>
  )
}

export function GridCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-square w-full rounded-md" />
      <Skeleton className="h-3.5 w-4/5" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}
