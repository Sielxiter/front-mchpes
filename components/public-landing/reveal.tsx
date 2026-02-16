"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "none"
}) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: "0px 0px -60px 0px", threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const slideClass = {
    up: "translate-y-8",
    down: "-translate-y-8",
    left: "translate-x-8",
    right: "-translate-x-8",
    none: "",
  }[direction]

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${slideClass}`,
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export function StaggerChildren({
  children,
  className,
  stagger = 80,
  direction = "up",
}: {
  children: React.ReactNode
  className?: string
  stagger?: number
  direction?: "up" | "down" | "left" | "right" | "none"
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, i) => (
        <Reveal delay={i * stagger} direction={direction}>
          {child}
        </Reveal>
      ))}
    </div>
  )
}
