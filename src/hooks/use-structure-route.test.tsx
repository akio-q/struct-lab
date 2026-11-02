import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useStructureRoute } from "./use-structure-route"

const searchParams = vi.hoisted(() => ({ current: new URLSearchParams() }))

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams.current,
}))

describe("useStructureRoute", () => {
  afterEach(() => {
    searchParams.current = new URLSearchParams()
    vi.restoreAllMocks()
    window.history.replaceState(null, "", "/")
  })

  it("reads a valid structure from the URL", () => {
    searchParams.current = new URLSearchParams("structure=stack")

    const { result } = renderHook(() => useStructureRoute())

    expect(result.current.structureId).toBe("stack")
  })

  it("falls back to the default structure for invalid values", () => {
    searchParams.current = new URLSearchParams("structure=heap")

    const { result } = renderHook(() => useStructureRoute())

    expect(result.current.structureId).toBe("array")
  })

  it("re-reads the structure when the URL search params change", () => {
    const { result, rerender } = renderHook(() => useStructureRoute())

    expect(result.current.structureId).toBe("array")

    searchParams.current = new URLSearchParams("structure=deque")
    rerender()

    expect(result.current.structureId).toBe("deque")
  })

  it("writes the selected structure with replaceState", () => {
    const replaceState = vi.spyOn(window.history, "replaceState")
    const { result } = renderHook(() => useStructureRoute())

    act(() => {
      result.current.setStructureId("linked-list")
    })

    expect(replaceState).toHaveBeenCalledWith(null, "", "/?structure=linked-list")
    expect(window.location.search).toBe("?structure=linked-list")
  })

  it("does not touch history when the URL already matches", () => {
    window.history.replaceState(null, "", "/?structure=queue")
    const replaceState = vi.spyOn(window.history, "replaceState")
    const { result } = renderHook(() => useStructureRoute())

    act(() => {
      result.current.setStructureId("queue")
    })

    expect(replaceState).not.toHaveBeenCalled()
  })
})
