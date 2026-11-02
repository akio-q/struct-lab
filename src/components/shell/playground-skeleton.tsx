export function PlaygroundSkeleton() {
  return (
    <div role="status" className="flex flex-1 flex-col">
      <span className="sr-only">Loading playground…</span>
      <div
        aria-hidden="true"
        className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-3 px-4 sm:gap-5 sm:px-6">
          <div className="h-7 w-32 animate-pulse rounded-md bg-white/[0.06] motion-reduce:animate-none" />
          <div className="h-8 w-44 animate-pulse rounded-xl bg-white/[0.04] motion-reduce:animate-none sm:w-64" />
          <div className="ml-auto size-8 animate-pulse rounded-lg bg-white/[0.04] motion-reduce:animate-none" />
        </div>
      </div>
      <div
        aria-hidden="true"
        className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:gap-6 lg:py-8"
      >
        <div className="h-8 w-64 animate-pulse rounded-md bg-white/[0.06] motion-reduce:animate-none" />
        <div className="min-h-[420px] flex-1 animate-pulse rounded-2xl border border-border/70 bg-panel/40 motion-reduce:animate-none" />
      </div>
    </div>
  )
}
