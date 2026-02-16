import {
  FileText,
  GraduationCap,
  IdCard,
  ScrollText,
  Check,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Reveal } from "@/components/public-landing/reveal"

const docs = [
  {
    icon: FileText,
    title: "Curriculum Vitae",
    desc: "CV actualisé détaillant votre parcours académique et professionnel.",
    format: "PDF",
  },
  {
    icon: ScrollText,
    title: "Lettre de motivation",
    desc: "Exposez vos motivations et votre projet scientifique.",
    format: "PDF",
  },
  {
    icon: GraduationCap,
    title: "Relevés académiques",
    desc: "Diplômes, attestations et relevés de notes certifiés.",
    format: "PDF",
  },
  {
    icon: IdCard,
    title: "Pièce d'identité",
    desc: "Copie lisible de votre carte nationale d'identité.",
    format: "PDF / Image",
  },
]

export function DocumentsSection() {
  return (
    <section id="documents" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
          {/* left intro */}
          <div className="lg:col-span-2">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Checklist
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Documents requis
              </h2>
              <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
                Préparez les pièces suivantes avant de démarrer votre candidature. Le format PDF est
                recommandé pour tous les fichiers.
              </p>
            </Reveal>
          </div>

          {/* right — document cards */}
          <div className="space-y-4 lg:col-span-3">
            {docs.map((doc, i) => (
              <Reveal key={doc.title} delay={60 + i * 70} direction="left">
                <div className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition-colors">
                    <doc.icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{doc.title}</h3>
                      <Badge variant="outline" className="rounded-md text-[10px]">
                        {doc.format}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {doc.desc}
                    </p>
                  </div>
                  <div className="mt-1 hidden shrink-0 sm:block">
                    <div className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-foreground/20 group-hover:text-foreground">
                      <Check className="size-4" />
                    </div>
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
