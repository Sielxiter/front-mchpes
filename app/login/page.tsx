import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "@/components/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex items-center justify-between">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="#" className="flex items-center gap-2 font-medium">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-4" />
              </div>
              MCH → PES
            </a>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <div className="absolute inset-0 p-8 md:p-10">
          <Card className="h-full w-full overflow-hidden">
            <div className="h-full w-full bg-card">
              <div className="h-full w-full p-10 md:p-12 animate-in fade-in-0 slide-in-from-right-6 duration-700">
                <div className="flex h-full flex-col">
                  <div className="space-y-4">
                    <Badge variant="outline" className="w-fit">
                      Plateforme de postulation
                    </Badge>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-semibold tracking-tight">MCH → PES</h2>
                      <p className="text-sm text-muted-foreground">
                        Promotion du grade de Maître de Conférences vers Professeur de l’Enseignement Supérieur.
                      </p>
                    </div>
                  </div>

                  <div className="my-8">
                    <Separator />
                  </div>

                  <div className="flex-1 space-y-6 text-sm text-muted-foreground">
                    <p className="text-base leading-relaxed text-foreground/80">
                      Déposez votre dossier, suivez son avancement, puis laissez la commission évaluer et préparer le PV.
                      Le président finalise audition, score et validation.
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-2 size-2 rounded-full bg-foreground/60" />
                        <div>Un seul espace pour documents, notes et PV.</div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-2 size-2 rounded-full bg-foreground/60" />
                        <div>Accès sécurisé par rôle: Candidat, Commission, Président, Admin.</div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-2 size-2 rounded-full bg-foreground/60" />
                        <div>Workflow clair, cohérent et traçable du début à la décision.</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 text-xs text-muted-foreground">
                    Accès institutionnel • Sécurité • Traçabilité
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
