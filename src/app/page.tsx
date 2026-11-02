import { Suspense } from "react"
import { PlaygroundPage } from "@/components/shell/playground-page"
import { PlaygroundSkeleton } from "@/components/shell/playground-skeleton"

export default function Home() {
  return (
    <Suspense fallback={<PlaygroundSkeleton />}>
      <PlaygroundPage />
    </Suspense>
  )
}
