"use client"

import { useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { resolveStructureId, structureHref } from "@/lib/structures/registry"
import type { StructureId } from "@/lib/structures/types"

export interface StructureRoute {
  structureId: StructureId
  setStructureId: (structureId: StructureId) => void
}

/**
 * Keeps the active structure in sync with `?structure=`.
 *
 * The value is validated against the structure registry and falls back to
 * `array`. Updates use `window.history.replaceState`, which Next.js routes
 * into `useSearchParams`, so browser back/forward navigation stays in sync.
 */
export function useStructureRoute(): StructureRoute {
  const searchParams = useSearchParams()
  const structureId = resolveStructureId(searchParams.get("structure"))

  const setStructureId = useCallback((nextStructureId: StructureId) => {
    const nextUrl = structureHref(nextStructureId)
    const currentUrl = `${window.location.pathname}${window.location.search}`

    if (currentUrl === nextUrl) {
      return
    }

    window.history.replaceState(null, "", nextUrl)
  }, [])

  return { structureId, setStructureId }
}
