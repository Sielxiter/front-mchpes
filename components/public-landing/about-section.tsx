import { BookOpen, GraduationCap, Target, TrendingUp } from "lucide-react"

import { Reveal } from "@/components/public-landing/reveal"

export function AboutSection() {
  return (
    <section id="about" className="relative overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        {/* header */}
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-2">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Le programme
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                À propos de la candidature
              </h2>
            </Reveal>
          </div>

          <div className="lg:col-span-3">
            <Reveal delay={80}>
              <p className="text-[17px] leading-relaxed text-muted-foreground">
                Cette plateforme centralise le processus de promotion MCH → PES à
                l&apos;Université Cadi Ayyad. L&apos;objectif : simplifier le dépôt de dossier,
                clarifier le parcours et offrir un suivi transparent du début à la fin.
              </p>
            </Reveal>
          </div>
        </div>

        {/* bento grid */}
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <Reveal delay={60}>
            <BentoInfo
              icon={<Target className="size-5" />}
              title="Objectif"
              text="Permettre aux enseignants-chercheurs de déposer et suivre leur candidature de manière structurée et efficace."
              accent
            />
          </Reveal>

          <Reveal delay={120}>
            <BentoInfo
              icon={<GraduationCap className="size-5" />}
              title="Public concerné"
              text="Maîtres de Conférences (MCH) souhaitant postuler au grade de Professeur de l'Enseignement Supérieur (PES)."
            />
          </Reveal>

          <Reveal delay={180}>
            <BentoInfo
              icon={<TrendingUp className="size-5" />}
              title="Avantages"
              text="Checklist de documents, workflow guidé étape par étape, et notifications automatiques à chaque avancée."
            />
          </Reveal>
        </div>

        {/* tip banner */}
        <Reveal delay={240}>
          <div className="mt-8 flex items-start gap-4 rounded-2xl border border-border bg-muted/30 p-5 sm:p-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
              <BookOpen className="size-[18px]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Conseil</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Préparez tous vos documents en format PDF avant de commencer. Cela vous fera gagner
                un temps précieux lors du remplissage.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function BentoInfo({
  icon,
  title,
  text,
  accent,
}: {
  icon: React.ReactNode
  title: string
  text: string
  accent?: boolean
}) {
  return (
    <div
      className={`group relative h-full overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
        accent
          ? "border-foreground/10 bg-foreground text-background"
          : "border-border bg-card text-foreground"
      }`}
    >
      <div
        className={`mb-4 inline-flex size-10 items-center justify-center rounded-xl ${
          accent ? "bg-background/15" : "bg-muted"
        }`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p
        className={`mt-2 text-sm leading-relaxed ${
          accent ? "text-background/75" : "text-muted-foreground"
        }`}
      >
        {text}
      </p>
      {/* shine */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/[0.04] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </div>
  )
}
