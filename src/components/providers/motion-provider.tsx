"use client"

import type { ReactNode } from "react"
import { LazyMotion } from "framer-motion"

// Loading the feature bundle asynchronously keeps the animation and layout
// machinery out of the initial client bundle. `domMax` is required because the
// canvases use layout animations and shared `layoutId` pills.
const loadFeatures = () =>
  import("@/components/providers/motion-features").then((module) => module.default)

export interface MotionProviderProps {
  children: ReactNode
}

export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  )
}
