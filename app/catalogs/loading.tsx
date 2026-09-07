export default function CatalogsLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-muted rounded" />
            <div className="h-8 w-64 bg-muted rounded-lg" />
            <div className="h-4 w-80 bg-muted/60 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-muted rounded-lg" />
            <div className="h-8 w-28 bg-muted rounded-lg" />
          </div>
        </div>

        {/* Filter bar skeleton */}
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="h-10 w-72 bg-muted rounded-xl" />
          <div className="h-10 w-64 bg-muted rounded-lg" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-2xl bg-card/60 overflow-hidden space-y-3 p-4">
              <div className="aspect-video w-full bg-muted/50 rounded-xl" />
              <div className="h-5 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted/60 rounded" />
              <div className="pt-2 flex justify-between items-center">
                <div className="h-5 w-24 bg-muted rounded" />
                <div className="h-5 w-16 bg-muted rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
