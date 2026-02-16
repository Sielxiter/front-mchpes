import { GraduationCap, Mail, ExternalLink } from "lucide-react"

import { Separator } from "@/components/ui/separator"

export function FooterSection() {
  const year = new Date().getFullYear()

  const footerLinks = [
    { href: "#about", label: "Programme" },
    { href: "#workflow", label: "Étapes" },
    { href: "#documents", label: "Documents" },
    { href: "#dates", label: "Dates" },
  ]

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-foreground text-background">
                <GraduationCap className="size-[18px]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  MCH<span className="mx-0.5 text-muted-foreground">→</span>PES
                </div>
                <div className="text-xs text-muted-foreground">Université Cadi Ayyad</div>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Plateforme de candidature à la promotion de Maître de Conférences vers Professeur de
              l&apos;Enseignement Supérieur.
            </p>
          </div>

          {/* links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Navigation
            </p>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* contact */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Contact
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href="mailto:contact@uca.ac.ma"
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail className="size-3.5" />
                  contact@uca.ac.ma
                </a>
              </li>
              <li>
                <a
                  href="https://www.uca.ma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ExternalLink className="size-3.5" />
                  www.uca.ma
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {year} Université Cadi Ayyad — ENSA Marrakech. Tous droits réservés.</p>
          <p>Candidature MCH → PES</p>
        </div>
      </div>
    </footer>
  )
}
