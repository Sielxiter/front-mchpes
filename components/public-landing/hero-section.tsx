import {
  ArrowRight,
  FileText,
  CheckCircle2,
  Clock,
  Users,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Reveal } from "@/components/public-landing/reveal"

export function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute -top-[40%] left-[10%] h-[80vh] w-[80vh] rounded-full bg-primary/[0.03] blur-[100px] motion-safe:animate-[drift_20s_ease-in-out_infinite]" />
        <div className="absolute -bottom-[30%] right-[5%] h-[70vh] w-[70vh] rounded-full bg-primary/[0.04] blur-[100px] motion-safe:animate-[drift_25s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-[20%] right-[30%] h-[50vh] w-[50vh] rounded-full bg-muted/50 blur-[80px] motion-safe:animate-[drift_18s_ease-in-out_infinite]" />
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col justify-center px-4 pt-20 pb-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ---------- Left column ---------- */}
          <div className="max-w-2xl">
            <Reveal>
              <Badge
                variant="secondary"
                className="mb-6 gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium"
              >
                <Sparkles className="size-3" />
                Campagne de candidature ouverte
              </Badge>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="text-[clamp(2.25rem,5vw,4rem)] leading-[1.08] font-extrabold tracking-tight text-foreground">
                Candidature de promotion{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">MCH → PES</span>
                  <span className="absolute bottom-1 left-0 -z-0 h-3 w-full bg-primary/10 sm:bottom-2 sm:h-4" />
                </span>
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted-foreground">
                Déposez votre dossier en ligne, suivez chaque étape du processus et recevez une
                notification dès que votre candidature est traitée.
              </p>
            </Reveal>

            <Reveal delay={180}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 gap-2 rounded-xl px-6 text-[15px]">
                  <a href="/login">
                    Commencer la candidature
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-xl px-6 text-[15px]"
                >
                  <a href="#workflow">Voir les étapes</a>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-foreground" /> 100 % en ligne
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-foreground" /> Suivi en temps réel
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5 text-foreground" /> Évaluation par commission
                </span>
              </div>
            </Reveal>
          </div>

          {/* ---------- Right column — visual bento preview ---------- */}
          <Reveal delay={200} direction="right" className="hidden lg:block">
            <div className="relative mx-auto w-full max-w-md">
              {/* glow behind */}
              <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-primary/[0.04] blur-2xl" />

              <div className="relative grid grid-cols-2 gap-3">
                <BentoCard
                  icon={<FileText className="size-5" />}
                  label="Dossier"
                  value="Complet"
                  className="col-span-2"
                  large
                />
                <BentoCard
                  icon={<CheckCircle2 className="size-5" />}
                  label="Étapes"
                  value="5"
                />
                <BentoCard
                  icon={<Clock className="size-5" />}
                  label="Délai"
                  value="Actif"
                />
                <BentoCard
                  icon={<Users className="size-5" />}
                  label="Commission"
                  value="Dédiée"
                  className="col-span-2"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* bottom gradient fade into next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background to-transparent" />

      {/* keyframes injected once */}
      <style>{`
        @keyframes drift {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-30px) translateX(15px); }
          50% { transform: translateY(10px) translateX(-20px); }
          75% { transform: translateY(-15px) translateX(10px); }
        }
      `}</style>
    </section>
  )
}

/* ---------- Bento sub-component ---------- */
function BentoCard({
  icon,
  label,
  value,
  large,
  className,
}: {
  icon: React.ReactNode
  label: string
  value: string
  large?: boolean
  className?: string
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${className ?? ""}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
          {icon}
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className={`font-bold text-foreground ${large ? "text-3xl" : "text-2xl"}`}>
            {value}
          </div>
        </div>
      </div>
      {/* shine sweep on hover */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-primary/[0.04] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </div>
  )
}
