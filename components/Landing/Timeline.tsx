import React from "react";
import {
  Upload,
  ClipboardCheck,
  Users,
  CheckCircle,
  Megaphone,
} from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Dépôt du dossier",
    description:
      "Le candidat soumet son dossier complet en ligne avec tous les documents requis.",
  },
  {
    icon: ClipboardCheck,
    title: "Vérification administrative",
    description:
      "L’administration vérifie la conformité et l’éligibilité du dossier.",
  },
  {
    icon: Users,
    title: "Évaluation commission",
    description:
      "La commission spécialisée examine et évalue le dossier académique.",
  },
  {
    icon: CheckCircle,
    title: "Validation",
    description:
      "Le président valide les décisions et finalise le processus d'évaluation.",
  },
  {
    icon: Megaphone,
    title: "Publication décision",
    description:
      "Les résultats sont publiés et communiqués aux candidats concernés.",
  },
];

export function Timeline() {
  return (
    <section id="processus" className="py-20 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Processus de candidature
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Un workflow structuré et transparent, du dépôt du dossier jusqu’à la
            publication des résultats.
          </p>
        </div>

        {/* Desktop Timeline */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Connection line */}
            <div className="absolute top-12 left-0 right-0 h-0.5 bg-border" />

            <div className="grid grid-cols-5 gap-4">
              {steps.map((step, index) => (
                <div key={index} className="relative flex flex-col items-center">
                  {/* Step circle */}
                  <div className="relative z-10 w-24 h-24 bg-card rounded-full border-4 border-border flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <step.icon className="h-10 w-10 text-foreground group-hover:scale-110 transition-transform duration-300" />
                  </div>

                  {/* Step number */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center text-sm font-bold z-20">
                    {index + 1}
                  </div>

                  {/* Step content */}
                  <div className="mt-6 text-center">
                    <h3 className="font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Timeline */}
        <div className="lg:hidden">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="relative flex gap-6">
                  {/* Step circle */}
                  <div className="relative z-10 shrink-0">
                    <div className="w-12 h-12 bg-card rounded-full border-4 border-border flex items-center justify-center shadow-lg">
                      <step.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  </div>

                  {/* Step content */}
                  <div className="pt-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
