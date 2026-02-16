"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  IconCheck,
  IconLoader2,
  IconAlertCircle,
  IconFileDescription,
  IconLock,
  IconMail,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { me } from "@/lib/auth"
import { candidatureApi, profileApi, enseignementsApi, pfesApi, activitesApi, ApiRequestError } from "@/lib/api"
import { clearAllDrafts } from "@/hooks/use-local-draft"
import {
  generateProfilePdf,
  generateEnseignementsPdf,
  generatePfePdf,
  generateActivitesAttestationPdf,
} from "@/lib/pdf/generated-documents"

interface StepStatus {
  id: number
  name: string
  status: "complete" | "incomplete" | "missing"
  missingItems?: string[]
}

const STEPS: StepStatus[] = [
  { id: 1, name: "Profil et Formulaire", status: "complete" },
  { id: 2, name: "Responsabilités pédagogiques", status: "complete" },
  { id: 3, name: "Encadrement des PFE", status: "complete" },
  { id: 4, name: "Activités d'enseignement", status: "incomplete", missingItems: ["Attestation A/2"] },
  { id: 5, name: "Activités de recherche", status: "incomplete", missingItems: ["Justificatif B/1"] },
  { id: 6, name: "Validation finale", status: "missing" },
]

export default function ValidationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [steps] = useState<StepStatus[]>(STEPS)
  const [confirmations, setConfirmations] = useState({
    exactitude: false,
    nonModification: false,
  })

  const openPdfBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const popup = window.open(url, "_blank", "noopener,noreferrer")
    if (!popup) {
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  const handlePreviewGenerated = async (
    docId: "profile" | "enseignements" | "pfes" | "attestation_ens" | "attestation_rech"
  ) => {
    try {
      if (!user) {
        const u = await me()
        if (u) setUser(u)
      }

      if (docId === "profile") {
        const { profile, user: apiUser } = await profileApi.getProfile()
        const blob = await generateProfilePdf({ profile, user: apiUser })
        openPdfBlob(blob, "formulaire-candidature.pdf")
        return
      }

      if (docId === "enseignements") {
        const { enseignements, totals } = await enseignementsApi.getAll()
        const blob = await generateEnseignementsPdf({
          enseignements: enseignements.map((e) => ({
            annee_universitaire: e.annee_universitaire,
            intitule: e.intitule,
            type_enseignement: e.type_enseignement,
            type_module: e.type_module,
            niveau: e.niveau,
            volume_horaire: Number(e.volume_horaire),
            equivalent_tp: Number(e.equivalent_tp),
          })),
          totals: {
            volume_horaire: Number(totals?.volume_horaire ?? 0),
            equivalent_tp: Number(totals?.equivalent_tp ?? 0),
          },
        })
        openPdfBlob(blob, "recapitulatif-enseignements.pdf")
        return
      }

      if (docId === "pfes") {
        const { pfes, totals } = await pfesApi.getAll()
        const blob = await generatePfePdf({
          pfes: pfes.map((p) => ({
            annee_universitaire: p.annee_universitaire,
            intitule: p.intitule,
            niveau: p.niveau,
            volume_horaire: Number(p.volume_horaire),
          })),
          totals: {
            volume_horaire: Number(totals?.volume_horaire ?? 0),
            count: Number(totals?.count ?? pfes.length),
          },
        })
        openPdfBlob(blob, "recapitulatif-pfes.pdf")
        return
      }

      if (docId === "attestation_ens") {
        const { activites } = await activitesApi.getAll("enseignement")
        const blob = await generateActivitesAttestationPdf({
          title: "Attestation des activités d'enseignement",
          activites: activites.map((a) => ({
            category: a.category,
            subcategory: a.subcategory,
            count: Number(a.count ?? 0),
          })),
        })
        openPdfBlob(blob, "attestation-activites-enseignement.pdf")
        return
      }

      const { activites } = await activitesApi.getAll("recherche")
      const blob = await generateActivitesAttestationPdf({
        title: "Attestation des activités de recherche",
        activites: activites.map((a) => ({
          category: a.category,
          subcategory: a.subcategory,
          count: Number(a.count ?? 0),
        })),
      })
      openPdfBlob(blob, "attestation-activites-recherche.pdf")
    } catch (error) {
      if (error instanceof ApiRequestError) {
        toast.error(error.message)
      } else {
        toast.error("Impossible de générer le document")
      }
    }
  }

  useEffect(() => {
    me().then((u) => {
      if (u) setUser(u)
    })
    // TODO: Fetch actual step completion status
  }, [])

  const completedSteps = steps.filter((s) => s.status === "complete").length
  const totalSteps = steps.length
  const progressPercent = (completedSteps / totalSteps) * 100
  const isComplete = steps.every((s) => s.status === "complete")
  const canSubmit =
    isComplete && confirmations.exactitude && confirmations.nonModification

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error("Veuillez compl\u00e9ter toutes les \u00e9tapes et accepter les conditions")
      return
    }

    setLoading(true)
    try {
      await candidatureApi.submit()

      // Clear all localStorage drafts on successful submission
      clearAllDrafts()

      // Show success message
      toast.success(
        "Dossier soumis avec succ\u00e8s! Un email de confirmation vous a \u00e9t\u00e9 envoy\u00e9.",
        {
          duration: 5000,
        }
      )

      // Redirect to dashboard
      router.push("/candidat")
    } catch (error) {
      if (error instanceof ApiRequestError) {
        toast.error(error.message)
      } else {
        toast.error("Erreur lors de la soumission du dossier")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Étape 6 : Récapitulatif et Validation</h1>
        <p className="text-muted-foreground mt-1">
          Vérifiez votre dossier avant la soumission finale.
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progression du dossier</CardTitle>
          <CardDescription>
            {completedSteps}/{totalSteps} étapes complètes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="mb-4" />
          <div className="grid gap-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  step.status === "complete"
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                    : step.status === "incomplete"
                    ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
                    : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                }`}
              >
                <div className="flex items-center gap-3">
                  {step.status === "complete" ? (
                    <IconCheck className="size-5 text-green-600" />
                  ) : step.status === "incomplete" ? (
                    <IconAlertCircle className="size-5 text-yellow-600" />
                  ) : (
                    <IconAlertCircle className="size-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      Étape {step.id}: {step.name}
                    </p>
                    {step.missingItems && step.missingItems.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Manquant: {step.missingItems.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                {step.status !== "complete" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/candidat/candidature/${
                          step.id === 1
                            ? "profil"
                            : step.id === 2
                            ? "enseignements"
                            : step.id === 3
                            ? "pfe"
                            : step.id === 4
                            ? "activites-enseignement"
                            : step.id === 5
                            ? "activites-recherche"
                            : "validation"
                        }`
                      )
                    }
                  >
                    Compléter
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileDescription className="size-5" />
            Documents générés
          </CardTitle>
          <CardDescription>
            Ces documents seront intégrés à votre dossier de candidature.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { id: "profile" as const, label: "Formulaire de demande de candidature (PDF)" },
            { id: "enseignements" as const, label: "Récapitulatif des enseignements (PDF)" },
            { id: "pfes" as const, label: "Récapitulatif des PFE encadrés (PDF)" },
            { id: "attestation_ens" as const, label: "Attestation des activités d'enseignement" },
            { id: "attestation_rech" as const, label: "Attestation des activités de recherche" },
          ].map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-3">
              <IconFileDescription className="size-4 text-blue-600" />
              <span className="text-sm">{doc.label}</span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto"
                onClick={() => handlePreviewGenerated(doc.id)}
              >
                Prévisualiser
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Confirmation */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmations obligatoires</CardTitle>
          <CardDescription>
            Veuillez lire et accepter les conditions suivantes avant de soumettre.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="exactitude"
              checked={confirmations.exactitude}
              onCheckedChange={(checked) =>
                setConfirmations({ ...confirmations, exactitude: !!checked })
              }
            />
            <Label htmlFor="exactitude" className="cursor-pointer leading-relaxed">
              Je certifie sur l'honneur l'exactitude de toutes les informations
              fournies dans ce dossier de candidature. Je reconnais que toute fausse
              déclaration peut entraîner l'annulation de ma candidature.
            </Label>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="nonModification"
              checked={confirmations.nonModification}
              onCheckedChange={(checked) =>
                setConfirmations({ ...confirmations, nonModification: !!checked })
              }
            />
            <Label htmlFor="nonModification" className="cursor-pointer leading-relaxed">
              Je comprends qu'après soumission, mon dossier sera verrouillé et ne
              pourra plus être modifié sauf autorisation exceptionnelle.
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Warning if incomplete */}
      {!isComplete && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <IconAlertCircle className="size-5" />
              <span className="font-medium">
                Votre dossier est incomplet. Veuillez compléter toutes les étapes avant
                de soumettre.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success preview */}
      {canSubmit && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardContent className="pt-6 space-y-2">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <IconCheck className="size-5" />
              <span className="font-medium">
                Votre dossier est complet et prêt à être soumis.
              </span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 ml-7">
              <IconMail className="inline size-4 mr-1" />
              Après soumission, vous recevrez :
            </p>
            <ul className="text-sm text-green-600 dark:text-green-400 ml-10 list-disc">
              <li>Un email de confirmation à {user?.email}</li>
              <li>Une notification WhatsApp (si configuré)</li>
              <li>Un accusé de réception téléchargeable</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Lock warning */}
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <IconLock className="size-5" />
            <span className="font-medium">
              Important: Après soumission ou après la date limite, votre dossier sera
              automatiquement verrouillé.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/candidat/candidature/activites-recherche")}
        >
          Retour
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !canSubmit}>
          {loading ? (
            <>
              <IconLoader2 className="mr-2 size-4 animate-spin" />
              Soumission en cours...
            </>
          ) : (
            <>
              <IconCheck className="mr-2 size-4" />
              Soumettre mon dossier
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
