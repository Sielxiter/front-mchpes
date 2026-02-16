import {
  UserRound,
  IdCard,
  FileUp,
  CheckCircle2,
  Mail,
} from "lucide-react"

import { Reveal } from "@/components/public-landing/reveal"

const steps = [
  {
    icon: UserRound,
    title: "Créer un compte",
    description:
      "Accédez à la plateforme et créez votre espace candidat pour démarrer le processus.",
  },
  {
    icon: IdCard,
    title: "Remplir les informations",
    description:
      "Complétez votre profil personnel, académique et professionnel avec les données demandées.",
  },
  {
    icon: FileUp,
    title: "Déposer les documents",
    description:
      "Téléversez les pièces justificatives requises selon la checklist fournie (format PDF).",
  },
  {
    icon: CheckCircle2,
    title: "Soumettre la candidature",
    description:
      "Vérifiez l'ensemble de votre dossier puis validez définitivement votre candidature.",
  },
  {
    icon: Mail,
    title: "Résultat & notification",
    description:
      "Votre dossier est examiné par la commission. Vous êtes notifié dès que le résultat est disponible.",
  },
]

export function WorkflowSection() {
  return (
    <section id="workflow" className="relative overflow-hidden bg-muted/30">
      {/* faint grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Workflow
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              5 étapes pour postuler
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
              Un parcours clair et structuré, du premier clic jusqu&apos;à la notification finale.
            </p>
          </div>
        </Reveal>

        {/* timeline */}
        <div className="relative mt-16">
          {/* vertical connector line (desktop) */}
          <div className="absolute left-[27px] top-0 hidden h-full w-px bg-border lg:block" />

          <div className="space-y-6 lg:space-y-0">
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={80 + i * 80}>
                <div className="group relative flex gap-5 lg:gap-8 lg:py-6">
                  {/* number circle */}
                  <div className="relative z-10 flex size-[54px] shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 group-hover:border-foreground/20 group-hover:shadow-md">
                    <span className="text-sm font-bold text-foreground">{i + 1}</span>
                  </div>

                  {/* card */}
                  <div className="flex-1 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <step.icon className="size-[18px]" />
                      </div>
                      <h3 className="font-semibold text-foreground">{step.title}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
