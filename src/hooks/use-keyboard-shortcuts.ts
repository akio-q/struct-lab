"use client"

import { useEffect } from "react"
import { PLAYBACK_SPEEDS, type Speed } from "@/lib/structures/types"

export interface KeyboardShortcutOptions {
  active?: boolean
  speed: Speed
  onTogglePlay: () => void
  onStepBack: () => void
  onStepForward: () => void
  onReset: () => void
  onSpeedChange: (speed: Speed) => void
}

const EDITABLE_SELECTOR =
  "input, textarea, select, option, [contenteditable='true'], [contenteditable='']"
const NATIVE_ACTIVATION_SELECTOR =
  "button, a[href], summary, [role='button'], [role='tab'], [role='menuitem']"
const TABLIST_SELECTOR = "[role='tablist']"

function matchesSelector(target: EventTarget | null, selector: string): boolean {
  return target instanceof Element && target.closest(selector) !== null
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (target instanceof HTMLElement && target.isContentEditable) {
    return true
  }

  return matchesSelector(target, EDITABLE_SELECTOR)
}

function hasModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey
}

function nextSpeed(speed: Speed, direction: -1 | 1): Speed {
  const index = PLAYBACK_SPEEDS.indexOf(speed)
  const nextIndex = Math.min(Math.max(index + direction, 0), PLAYBACK_SPEEDS.length - 1)

  return PLAYBACK_SPEEDS[nextIndex]
}

/**
 * Wires playback shortcuts for the active structure panel. The hook ignores
 * modified keys, editable targets, and native button activation so it never
 * competes with text entry or the focused control's own keyboard behavior.
 */
export function useKeyboardShortcuts({
  active = true,
  speed,
  onTogglePlay,
  onStepBack,
  onStepForward,
  onReset,
  onSpeedChange,
}: KeyboardShortcutOptions): void {
  useEffect(() => {
    if (!active) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || hasModifier(event) || isEditableTarget(event.target)) {
        return
      }

      // Arrow and Home keys navigate the tab strip; leave them to that widget.
      if (matchesSelector(event.target, TABLIST_SELECTOR)) {
        return
      }

      if (event.code === "Space" || event.key === " ") {
        if (event.repeat || matchesSelector(event.target, NATIVE_ACTIVATION_SELECTOR)) {
          return
        }

        event.preventDefault()
        onTogglePlay()
        return
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault()
        onStepBack()
        return
      }

      if (event.key === "ArrowRight") {
        event.preventDefault()
        onStepForward()
        return
      }

      if (event.key === "Home") {
        if (event.repeat) {
          return
        }

        event.preventDefault()
        onReset()
        return
      }

      const slower = event.code === "BracketLeft" || event.key === "["
      const faster = event.code === "BracketRight" || event.key === "]"

      if (!slower && !faster) {
        return
      }

      if (event.repeat) {
        return
      }

      event.preventDefault()

      const value = nextSpeed(speed, slower ? -1 : 1)

      if (value !== speed) {
        onSpeedChange(value)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [active, onReset, onSpeedChange, onStepBack, onStepForward, onTogglePlay, speed])
}
