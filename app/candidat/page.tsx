"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  IconFileDescription, 
  IconClock, 
  IconCheck, 
  IconAlertCircle,
  IconArrowRight,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { me } from "@/lib/auth"

interface CandidatureStatus {
  step: number
  totalSteps: number
  status: "draft" | "submitted" | "blocked"
  deadline: string | null
}

export default function Page() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [candidature, setCandidature] = useState<CandidatureStatus>({
    step: 1,
    totalSteps: 6,
    status: "draft",
    deadline: "2026-03-15T23:59:59",
  })

  useEffect(() => {
    me().then((u) => {
      if (u) setUser(u)
    })
    // TODO: Fetch candidature status from API
  }, [])

  const progressPercent = (candidature.step / candidature.totalSteps) * 100
  const deadlineDate = candidature.deadline ? new Date(candidature.deadline) : null
  const daysRemaining = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">
          Bienvenue{user ? `, ${user.name}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre dossier de candidature pour le passage au grade de Professeur de l'Enseignement Supérieur.
        </p>
      </div>

      {/* Deadline Warning */}
      {daysRemaining !== null && daysRemaining <= 30 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <IconClock className="size-5" />
            <span className="font-medium">
              {daysRemaining > 0
                ? `${daysRemaining} jour${daysRemaining > 1 ? "s" : ""} restant${daysRemaining > 1 ? "s" : ""} avant la clôture`
                : "Date limite dépassée"}
            </span>
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progression</CardTitle>
            <IconFileDescription className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {candidature.step}/{candidature.totalSteps} étapes
            </div>
            <Progress value={progressPercent} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(progressPercent)}% complété
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut</CardTitle>
            {candidature.status === "draft" && (
              <IconAlertCircle className="size-4 text-yellow-500" />
            )}
            {candidature.status === "submitted" && (
              <IconCheck className="size-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {candidature.status === "draft" && "Brouillon"}
              {candidature.status === "submitted" && "Soumis"}
              {candidature.status === "blocked" && "Bloqué"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {candidature.status === "draft" && "Votre dossier est en cours de rédaction"}
              {candidature.status === "submitted" && "Votre dossier a été soumis"}
              {candidature.status === "blocked" && "Veuillez corriger les erreurs"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Date limite</CardTitle>
            <IconClock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deadlineDate
                ? deadlineDate.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Non définie"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {daysRemaining !== null && daysRemaining > 0
                ? `Dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}`
                : "Date passée"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Section */}
      <Card>
        <CardHeader>
          <CardTitle>Continuer votre candidature</CardTitle>
          <CardDescription>
            Reprenez là où vous vous êtes arrêté ou commencez une nouvelle étape.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <Button asChild>
            <Link href="/candidat/candidature/profil">
              {candidature.step === 1 ? "Commencer" : "Continuer"}
              <IconArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/candidat/candidature/validation">
              Voir le récapitulatif
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Steps Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Étapes du dossier</CardTitle>
          <CardDescription>
            Votre dossier de candidature comprend 6 étapes à compléter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { step: 1, title: "Profil et Formulaire", desc: "Informations personnelles et demande de candidature" },
              { step: 2, title: "Responsabilités pédagogiques", desc: "Enseignements effectués par année" },
              { step: 3, title: "Encadrement des PFE", desc: "Projets de fin d'études encadrés" },
              { step: 4, title: "Activités d'enseignement", desc: "Production pédagogique, encadrement, responsabilités" },
              { step: 5, title: "Activités de recherche", desc: "Production scientifique, encadrement, responsabilités" },
              { step: 6, title: "Validation finale", desc: "Récapitulatif et soumission du dossier" },
            ].map((item) => (
              <div
                key={item.step}
                className={`flex items-start gap-4 rounded-lg border p-4 ${
                  item.step < candidature.step
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                    : item.step === candidature.step
                    ? "border-primary bg-primary/5"
                    : ""
                }`}
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                    item.step < candidature.step
                      ? "bg-green-600 text-white"
                      : item.step === candidature.step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.step < candidature.step ? (
                    <IconCheck className="size-4" />
                  ) : (
                    item.step
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                {item.step === candidature.step && (
                  <Button size="sm" asChild>
                    <Link href={`/candidat/candidature/${
                      item.step === 1 ? "profil" :
                      item.step === 2 ? "enseignements" :
                      item.step === 3 ? "pfe" :
                      item.step === 4 ? "activites-enseignement" :
                      item.step === 5 ? "activites-recherche" : "validation"
                    }`}>
                      Continuer
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
