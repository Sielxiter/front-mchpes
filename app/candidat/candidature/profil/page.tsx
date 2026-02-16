"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { IconCheck, IconFile, IconLoader2, IconCloudUpload, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { me } from "@/lib/auth"
import { profileApi, documentsApi, ApiRequestError } from "@/lib/api"
import { useLocalDraft } from "@/hooks/use-local-draft"

interface ProfileForm {
  nom: string
  prenom: string
  email: string
  date_naissance: string
  etablissement: string
  ville: string
  departement: string
  grade_actuel: string
  date_recrutement_es: string
  date_recrutement_fp: string
  numero_som: string
  telephone: string
  specialite: string
}

interface UploadedCv {
  id: number
  original_name: string
  size: number
}

const GRADE_OPTIONS = [
  "Maître de Conférences Habilité (MCH)",
  "Maître de Conférences (MCF)",
  "Professeur Assistant",
]

const VILLES = [
  "Casablanca", "Rabat", "Fès", "Marrakech", "Tanger", "Meknès", 
  "Oujda", "Agadir", "Tétouan", "Safi", "El Jadida", "Kénitra", 
  "Mohammedia", "Béni Mellal", "Nador", "Settat"
]

const MAX_FILE_SIZE = 10 * 1024 * 1024

function normalizeDateForInput(value: string | null | undefined): string {
  if (!value) return ""
  // Backend returns ISO timestamps; <input type="date"> expects YYYY-MM-DD.
  if (value.length >= 10) return value.slice(0, 10)
  return value
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export default function ProfilPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadedCv, setUploadedCv] = useState<UploadedCv | null>(null)
  const [uploadingCv, setUploadingCv] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({})
  
  // Use localStorage for draft persistence
  const { 
    data: form, 
    setData: setForm, 
    clearDraft,
    lastSaved 
  } = useLocalDraft<ProfileForm>("profile", {
    nom: "",
    prenom: "",
    email: "",
    date_naissance: "",
    etablissement: "",
    ville: "",
    departement: "",
    grade_actuel: "",
    date_recrutement_es: "",
    date_recrutement_fp: "",
    numero_som: "",
    telephone: "",
    specialite: "",
  })

  // Load from API and pre-fill from Google OAuth
  useEffect(() => {
    const loadData = async () => {
      try {
        // First try to load from API
        const [{ profile, user }, docs] = await Promise.all([
          profileApi.getProfile(),
          documentsApi.getAll("profile_pdf"),
        ])

        if (docs.documents.length > 0) {
          const latest = docs.documents[0]
          setUploadedCv({
            id: latest.id,
            original_name: latest.original_name,
            size: latest.size,
          })
        }
        
        if (profile) {
          // Profile exists in DB, use it (overrides localStorage draft)
          setForm((prev) => ({
            ...prev,
            nom: profile.nom || prev.nom,
            prenom: profile.prenom || prev.prenom,
            date_naissance: normalizeDateForInput(profile.date_naissance) || prev.date_naissance,
            etablissement: profile.etablissement || prev.etablissement,
            ville: profile.ville || prev.ville,
            departement: profile.departement || prev.departement,
            grade_actuel: profile.grade_actuel || prev.grade_actuel,
            date_recrutement_es: normalizeDateForInput(profile.date_recrutement_es) || prev.date_recrutement_es,
            date_recrutement_fp:
              normalizeDateForInput(profile.date_recrutement_fp) || prev.date_recrutement_fp,
            numero_som: profile.numero_som || prev.numero_som,
            telephone: profile.telephone || prev.telephone,
            specialite: profile.specialite || prev.specialite,
          }))
        } else if (user) {
          // No profile yet, pre-fill from user (Google OAuth)
          const [prenom, ...nomParts] = user.name.split(" ")
          setForm((prev) => ({
            ...prev,
            email: user.email,
            prenom: prev.prenom || prenom || "",
            nom: prev.nom || nomParts.join(" ") || "",
          }))
        }
      } catch {
        // If API fails, try to get user info for email pre-fill
        try {
          const user = await me()
          if (user) {
            const [prenom, ...nomParts] = user.name.split(" ")
            setForm((prev) => ({
              ...prev,
              email: user.email,
              prenom: prev.prenom || prenom || "",
              nom: prev.nom || nomParts.join(" ") || "",
            }))
          }
        } catch {
          // Ignore
        }
      } finally {
        setInitialLoading(false)
      }
    }
    
    loadData()
  }, [setForm])

  // Auto-save to API (debounced)
  const autoSave = useCallback(async () => {
    if (!form.nom && !form.prenom) return
    
    setSaving(true)
    try {
      await profileApi.autosave({
        nom: form.nom,
        prenom: form.prenom,
        date_naissance: normalizeDateForInput(form.date_naissance) || undefined,
        etablissement: form.etablissement || undefined,
        ville: form.ville || undefined,
        departement: form.departement || undefined,
        grade_actuel: form.grade_actuel || undefined,
        date_recrutement_es: normalizeDateForInput(form.date_recrutement_es) || undefined,
        date_recrutement_fp: normalizeDateForInput(form.date_recrutement_fp) || undefined,
        numero_som: form.numero_som || undefined,
        telephone: form.telephone || undefined,
        specialite: form.specialite || undefined,
      })
    } catch {
      // Auto-save failures are silent - localStorage backup is there
    } finally {
      setSaving(false)
    }
  }, [form])

  useEffect(() => {
    if (initialLoading) return
    
    const timer = setTimeout(() => {
      if (form.nom || form.prenom) {
        autoSave()
      }
    }, 3000) // Auto-save every 3 seconds of inactivity
    
    return () => clearTimeout(timer)
  }, [form, autoSave, initialLoading])

  // Calculate ancienneté
  const calculateAnciennete = () => {
    if (!form.date_recrutement_es) return null
    const recrutementDate = new Date(form.date_recrutement_es)
    const now = new Date()
    const years = Math.floor((now.getTime() - recrutementDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    const months = Math.floor(((now.getTime() - recrutementDate.getTime()) % (365.25 * 24 * 60 * 60 * 1000)) / (30 * 24 * 60 * 60 * 1000))
    return { years, months }
  }

  const anciennete = calculateAnciennete()

  const updateField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  const validateCvFile = (file: File): string | null => {
    if (file.type !== "application/pdf") {
      return "Seuls les fichiers PDF sont autorisés"
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Le fichier ne doit pas dépasser 10 Mo"
    }
    return null
  }

  const uploadCv = async (file: File) => {
    const validationError = validateCvFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setUploadingCv(true)
    setUploadProgress(0)

    try {
      if (uploadedCv) {
        await documentsApi.delete(uploadedCv.id)
      }

      const response = await documentsApi.upload(file, "profile_pdf", (percent) => {
        setUploadProgress(percent)
      })

      setUploadedCv({
        id: response.document.id,
        original_name: response.document.original_name,
        size: response.document.size,
      })

      toast.success("CV téléversé avec succès")
    } catch (error) {
      if (error instanceof ApiRequestError) {
        toast.error(error.message)
      } else {
        toast.error("Erreur lors du téléversement du CV")
      }
    } finally {
      setUploadingCv(false)
      setUploadProgress(0)
    }
  }

  const handleCvDelete = async () => {
    if (!uploadedCv) return
    try {
      await documentsApi.delete(uploadedCv.id)
      setUploadedCv(null)
      toast.success("CV supprimé")
    } catch {
      toast.error("Erreur lors de la suppression du CV")
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileForm, string>> = {}
    
    if (!form.nom) newErrors.nom = "Le nom est requis"
    if (!form.prenom) newErrors.prenom = "Le prénom est requis"
    if (!form.date_naissance) newErrors.date_naissance = "La date de naissance est requise"
    if (!form.etablissement) newErrors.etablissement = "L&apos;établissement est requis"
    if (!form.ville) newErrors.ville = "La ville est requise"
    if (!form.departement) newErrors.departement = "Le département est requis"
    if (!form.grade_actuel) newErrors.grade_actuel = "Le grade est requis"
    if (!form.date_recrutement_es) newErrors.date_recrutement_es = "La date est requise"
    if (!form.numero_som) newErrors.numero_som = "Le numéro SOM est requis"
    if (!form.telephone) newErrors.telephone = "Le téléphone est requis"
    if (!form.specialite) newErrors.specialite = "La spécialité est requise"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      toast.error("Veuillez corriger les erreurs avant de continuer")
      return
    }

    if (!uploadedCv) {
      toast.error("Le CV au format PDF est obligatoire pour continuer")
      return
    }

    setLoading(true)
    try {
      await profileApi.saveProfile({
        nom: form.nom,
        prenom: form.prenom,
        date_naissance: form.date_naissance,
        etablissement: form.etablissement,
        ville: form.ville,
        departement: form.departement,
        grade_actuel: form.grade_actuel,
        date_recrutement_es: form.date_recrutement_es,
        date_recrutement_fp: form.date_recrutement_fp || null,
        numero_som: form.numero_som,
        telephone: form.telephone,
        specialite: form.specialite,
        a_demande_avancement: false,
        a_dossier_en_cours: false,
      })
      clearDraft() // Clear localStorage draft on successful save
      toast.success("Profil enregistré avec succès")
      router.push("/candidat/candidature/enseignements")
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.errors) {
          const firstError = Object.values(error.errors)[0]?.[0]
          toast.error(firstError || error.message)
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error("Erreur lors de l&apos;enregistrement")
      }
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <IconLoader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Étape 1 : Profil et Formulaire</h1>
          <p className="text-muted-foreground mt-1">
            Renseignez vos informations personnelles pour la candidature.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {saving ? (
            <>
              <IconLoader2 className="size-4 animate-spin" />
              Sauvegarde...
            </>
          ) : lastSaved ? (
            <>
              <IconCheck className="size-4 text-green-600" />
              Sauvegardé à {lastSaved.toLocaleTimeString("fr-FR")}
            </>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>
              Certaines informations sont pré-remplies via votre compte Google.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom <span className="text-red-500">*</span></Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => updateField("nom", e.target.value)}
                className={errors.nom ? "border-red-500" : ""}
              />
              {errors.nom && <p className="text-xs text-red-500">{errors.nom}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom <span className="text-red-500">*</span></Label>
              <Input
                id="prenom"
                value={form.prenom}
                onChange={(e) => updateField("prenom", e.target.value)}
                className={errors.prenom ? "border-red-500" : ""}
              />
              {errors.prenom && <p className="text-xs text-red-500">{errors.prenom}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Google)</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_naissance">Date de naissance <span className="text-red-500">*</span></Label>
              <Input
                id="date_naissance"
                type="date"
                value={form.date_naissance}
                onChange={(e) => updateField("date_naissance", e.target.value)}
                className={errors.date_naissance ? "border-red-500" : ""}
              />
              {errors.date_naissance && <p className="text-xs text-red-500">{errors.date_naissance}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone <span className="text-red-500">*</span></Label>
              <Input
                id="telephone"
                type="tel"
                placeholder="+212 6XX XXX XXX"
                value={form.telephone}
                onChange={(e) => updateField("telephone", e.target.value)}
                className={errors.telephone ? "border-red-500" : ""}
              />
              {errors.telephone && <p className="text-xs text-red-500">{errors.telephone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_som">Numéro SOM <span className="text-red-500">*</span></Label>
              <Input
                id="numero_som"
                value={form.numero_som}
                onChange={(e) => updateField("numero_som", e.target.value)}
                className={errors.numero_som ? "border-red-500" : ""}
              />
              {errors.numero_som && <p className="text-xs text-red-500">{errors.numero_som}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations professionnelles</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="etablissement">Établissement <span className="text-red-500">*</span></Label>
              <Input
                id="etablissement"
                placeholder="Université / École"
                value={form.etablissement}
                onChange={(e) => updateField("etablissement", e.target.value)}
                className={errors.etablissement ? "border-red-500" : ""}
              />
              {errors.etablissement && <p className="text-xs text-red-500">{errors.etablissement}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ville">Ville <span className="text-red-500">*</span></Label>
              <Select value={form.ville} onValueChange={(v) => updateField("ville", v)}>
                <SelectTrigger className={errors.ville ? "border-red-500" : ""}>
                  <SelectValue placeholder="Sélectionner une ville" />
                </SelectTrigger>
                <SelectContent>
                  {VILLES.map((ville) => (
                    <SelectItem key={ville} value={ville}>{ville}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.ville && <p className="text-xs text-red-500">{errors.ville}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="departement">Département <span className="text-red-500">*</span></Label>
              <Input
                id="departement"
                value={form.departement}
                onChange={(e) => updateField("departement", e.target.value)}
                className={errors.departement ? "border-red-500" : ""}
              />
              {errors.departement && <p className="text-xs text-red-500">{errors.departement}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialite">Spécialité <span className="text-red-500">*</span></Label>
              <Input
                id="specialite"
                value={form.specialite}
                onChange={(e) => updateField("specialite", e.target.value)}
                className={errors.specialite ? "border-red-500" : ""}
              />
              {errors.specialite && <p className="text-xs text-red-500">{errors.specialite}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade_actuel">Grade actuel <span className="text-red-500">*</span></Label>
              <Select value={form.grade_actuel} onValueChange={(v) => updateField("grade_actuel", v)}>
                <SelectTrigger className={errors.grade_actuel ? "border-red-500" : ""}>
                  <SelectValue placeholder="Sélectionner un grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((grade) => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.grade_actuel && <p className="text-xs text-red-500">{errors.grade_actuel}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_recrutement_es">
                Date de recrutement dans l&apos;enseignement supérieur <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date_recrutement_es"
                type="date"
                value={form.date_recrutement_es}
                onChange={(e) => updateField("date_recrutement_es", e.target.value)}
                className={errors.date_recrutement_es ? "border-red-500" : ""}
              />
              {errors.date_recrutement_es && <p className="text-xs text-red-500">{errors.date_recrutement_es}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="date_recrutement_fp">
                Si fonctionnaire avant : date de recrutement à la fonction publique
              </Label>
              <Input
                id="date_recrutement_fp"
                type="date"
                value={form.date_recrutement_fp}
                onChange={(e) => updateField("date_recrutement_fp", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ancienneté Display */}
        {anciennete && (
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <IconCheck className="size-5" />
                <span className="font-medium">
                  Ancienneté calculée: {anciennete.years} an{anciennete.years > 1 ? "s" : ""} et {anciennete.months} mois
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>CV (obligatoire)</CardTitle>
            <CardDescription>
              Déposez votre CV au format PDF (taille max 10 Mo).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              id="cv-upload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  uploadCv(file)
                }
                e.target.value = ""
              }}
            />

            <div
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const file = e.dataTransfer.files?.[0]
                if (file) {
                  uploadCv(file)
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setDragOver(false)
              }}
              onClick={() => {
                if (!uploadingCv) {
                  document.getElementById("cv-upload")?.click()
                }
              }}
              className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              } ${uploadingCv ? "pointer-events-none opacity-70" : "cursor-pointer"}`}
            >
              {uploadingCv ? (
                <div className="mx-auto max-w-xs space-y-3">
                  <IconLoader2 className="mx-auto size-8 animate-spin text-primary" />
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground">Téléversement… {uploadProgress}%</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <IconCloudUpload className="mx-auto size-8 text-primary" />
                  <p className="font-medium">Glissez-déposez votre CV PDF ici</p>
                  <p className="text-sm text-muted-foreground">ou cliquez pour sélectionner un fichier</p>
                </div>
              )}
            </div>

            {uploadedCv && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <IconFile className="size-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{uploadedCv.original_name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(uploadedCv.size)}</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={handleCvDelete}>
                  <IconX className="size-4 text-red-500" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push("/candidat")}>
            Retour
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <IconLoader2 className="mr-2 size-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer et continuer"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
