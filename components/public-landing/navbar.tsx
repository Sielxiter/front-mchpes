"use client"

import * as React from "react"
import { GraduationCap, ArrowRight, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const links = [
  { href: "#about", label: "Programme" },
  { href: "#workflow", label: "Étapes" },
  { href: "#documents", label: "Documents" },
  { href: "#dates", label: "Dates" },
]

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", fn, { passive: true })
    fn()
    return () => window.removeEventListener("scroll", fn)
  }, [])

  const go = (href: string) => {
    setOpen(false)
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/70 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* brand */}
        <button
          className="flex items-center gap-2.5 text-foreground"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-foreground text-background">
            <GraduationCap className="size-[18px]" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            MCH<span className="mx-0.5 text-muted-foreground">→</span>PES
          </span>
        </button>

        {/* desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <button
              key={l.href}
              onClick={() => go(l.href)}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* desktop cta */}
        <div className="hidden md:block">
          <Button asChild size="sm" className="gap-1.5 rounded-lg">
            <a href="/login">
              Postuler
              <ArrowRight className="size-3.5" />
            </a>
          </Button>
        </div>

        {/* mobile toggle */}
        <button
          className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* mobile menu */}
      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-4">
            {links.map((l) => (
              <button
                key={l.href}
                onClick={() => go(l.href)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </button>
            ))}
            <div className="pt-2">
              <Button asChild size="sm" className="w-full gap-1.5 rounded-lg">
                <a href="/login">
                  Postuler <ArrowRight className="size-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
