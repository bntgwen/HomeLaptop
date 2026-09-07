export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-32 bg-muted/60 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-20 bg-muted rounded-md" />
          <div className="h-8 w-20 bg-muted rounded-md" />
        </div>
      </div>

      {/* Stats Cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl border bg-card/60 space-y-2">
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="h-7 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Content list skeleton */}
      <div className="border rounded-xl bg-card/60 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="h-5 w-40 bg-muted rounded" />
        <div className="space-y-3 pt-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-muted/40 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
