import { CalendarDays, CalendarClock, Bell } from "lucide-react"

import { Reveal } from "@/components/public-landing/reveal"

export type ImportantDates = {
  opening?: string
  deadline?: string
  results?: string
}

const meta = [
  {
    key: "opening" as const,
    icon: CalendarDays,
    label: "Ouverture",
    accent: false,
  },
  {
    key: "deadline" as const,
    icon: CalendarClock,
    label: "Date limite",
    accent: true,
  },
  {
    key: "results" as const,
    icon: Bell,
    label: "Résultats",
    accent: false,
  },
]

export function DatesSection({ dates }: { dates: ImportantDates }) {
  return (
    <section id="dates" className="relative overflow-hidden bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Calendrier
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Dates importantes
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
              Consultez le calendrier de la campagne et anticipez chaque échéance.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {meta.map((m, i) => {
            const value = dates[m.key] ?? "À confirmer"
            return (
              <Reveal key={m.key} delay={80 + i * 80}>
                <div
                  className={`group relative flex flex-col items-center overflow-hidden rounded-2xl border p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                    m.accent
                      ? "border-foreground/10 bg-foreground text-background"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  <div
                    className={`mb-5 flex size-14 items-center justify-center rounded-2xl ${
                      m.accent ? "bg-background/15" : "bg-muted"
                    }`}
                  >
                    <m.icon className="size-6" />
                  </div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-widest ${
                      m.accent ? "text-background/60" : "text-muted-foreground"
                    }`}
                  >
                    {m.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{value}</p>

                  {/* shine */}
                  <div className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/[0.04] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
