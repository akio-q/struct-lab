import type { Complexity } from "./types"

export function constantTime(note: string): Complexity {
  return {
    time: "O(1)",
    space: "O(n)",
    note,
  }
}

export function linearTime(note: string): Complexity {
  return {
    time: "O(n)",
    space: "O(n)",
    note,
  }
}
