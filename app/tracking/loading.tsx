export default function TrackingLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 animate-pulse">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2 flex flex-col items-center">
          <div className="h-3 w-32 bg-muted rounded" />
          <div className="h-8 w-60 bg-muted rounded-lg" />
          <div className="h-4 w-72 bg-muted/60 rounded" />
        </div>

        {/* Search input skeleton */}
        <div className="flex gap-2">
          <div className="h-11 flex-1 bg-muted rounded-lg" />
          <div className="h-11 w-20 bg-muted rounded-lg" />
        </div>

        {/* Card skeleton */}
        <div className="border rounded-xl bg-card/60 p-6 space-y-6">
          <div className="space-y-2 border-b pb-4">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-4 w-36 bg-muted/60 rounded" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-20 bg-muted/40 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
