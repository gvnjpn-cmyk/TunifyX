export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton rounded ${className || ''}`} style={style} />
}

export function TrackCardSkeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div className="flex items-center gap-3 p-2" style={style}>
      <Skeleton className="w-10 h-10 rounded shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
      <Skeleton className="h-3 w-8 rounded hidden sm:block" />
    </div>
  )
}

export function GridCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-square w-full rounded-md mb-2" />
      <Skeleton className="h-3.5 w-4/5 rounded mb-1.5" />
      <Skeleton className="h-3 w-3/5 rounded" />
    </div>
  )
}
