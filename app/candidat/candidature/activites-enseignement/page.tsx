"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { IconCheck, IconLoader2, IconUpload, IconFile, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { activitesApi, documentsApi, ApiRequestError } from "@/lib/api"
import { useLocalDraftArray } from "@/hooks/use-local-draft"

interface ActivityEntry {
  id: string
  category: string
  subcategory: string
  count: number
  file?: File
  fileName?: string
  uploadProgress?: number
}

const CATEGORY_TITLES: Record<string, string> = {
  "A/1": "A/1 - Enseignement et production pédagogique",
  "A/2": "A/2 - Encadrement pédagogique",
  "A/3": "A/3 - Responsabilités pédagogiques",
}

// Must match backend validation in ActiviteController::ENSEIGNEMENT_CATEGORIES
const ACTIVITIES: Record<string, string[]> = {
  "A/1": [
    "Conception et montage d'une filière accréditée comme coordonnateur",
    "Coordination d'une filière accréditée ou d'un établissement",
    "Préparation de cours ou TD ou TP d'un module nouveaux",
    "Préparation de supports et polycopiés de cours ou TD ou TP",
    "Participation aux travaux des jurys au niveau national",
    "Responsable d'un module",
  ],
  "A/2": [
    "Encadrement de PFE Licence, Master, Ingénieur",
    "Encadrement de stages et visites de terrain",
    "Formation de formateurs et personnel",
  ],
  "A/3": [
    "Tutorat d'étudiants (PFE, stages...)",
    "Organisation de manifestations scientifiques ou pédagogiques",
    "Participation active aux travaux des commissions pédagogiques",
  ],
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["application/pdf"]

export default function ActivitesEnseignementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Use localStorage for draft persistence
  const { 
    items: entries, 
    setItems: setEntries, 
    clearDraft,
    lastSaved 
  } = useLocalDraftArray<ActivityEntry>("activites_enseignement", [])
  
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const isRealFile = (value: unknown): value is File => {
    return typeof File !== "undefined" && value instanceof File
  }

  const isValidEntry = useCallback((entry: ActivityEntry) => {
    const allowed = ACTIVITIES[entry.category]
    return Array.isArray(allowed) && allowed.includes(entry.subcategory)
  }, [])

  // Load from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await activitesApi.getAll("enseignement")
        if (response.activites.length > 0) {
          setEntries(response.activites.map(a => ({
            id: String(a.id),
            category: a.category,
            subcategory: a.subcategory,
            count: a.count,
            fileName: a.document?.original_name,
          })))
        }
      } catch {
        // API failed, will use localStorage draft
      } finally {
        setInitialLoading(false)
      }
    }
    loadData()
  }, [setEntries])

  const autoSave = useCallback(async () => {
    const hasPendingUpload = entries.some(
      (e) => e.uploadProgress !== undefined || isRealFile(e.file)
    )
    if (hasPendingUpload) return

    const validEntries = entries.filter(isValidEntry)
    if (validEntries.length === 0) return
    setSaving(true)
    try {
      await activitesApi.bulkSave(
        "enseignement",
        validEntries.map(e => ({
          category: e.category,
          subcategory: e.subcategory,
          count: e.count,
        }))
      )
    } catch {
      // Silent fail - localStorage backup is there
    } finally {
      setSaving(false)
    }
  }, [entries, isValidEntry])

  useEffect(() => {
    if (initialLoading) return
    const timer = setTimeout(() => {
      if (entries.length > 0) {
        autoSave()
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [entries, autoSave, initialLoading])

  const updateEntry = (category: string, subcategory: string, count: number) => {
    const existingIndex = entries.findIndex(
      (e) => e.category === category && e.subcategory === subcategory
    )

    if (existingIndex >= 0) {
      if (count === 0) {
        setEntries(entries.filter((_, i) => i !== existingIndex))
      } else {
        const updated = [...entries]
        updated[existingIndex] = { ...updated[existingIndex], count }
        setEntries(updated)
      }
    } else if (count > 0) {
      setEntries([
        ...entries,
        {
          id: crypto.randomUUID(),
          category,
          subcategory,
          count,
        },
      ])
    }
  }

  const getEntryCount = (category: string, subcategory: string): number => {
    const entry = entries.find(
      (e) => e.category === category && e.subcategory === subcategory
    )
    return entry?.count || 0
  }

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return "Le fichier est trop volumineux (max 10 Mo)"
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Type de fichier non autorisé (PDF uniquement)"
    }
    return null
  }

  const handleFileChange = async (
    category: string,
    subcategory: string,
    file: File | undefined
  ) => {
    if (!file) return

    const error = validateFile(file)
    if (error) {
      toast.error(error)
      return
    }

    const entryIndex = entries.findIndex(
      (e) => e.category === category && e.subcategory === subcategory
    )

    if (entryIndex < 0) {
      toast.error("Veuillez d'abord indiquer le nombre de contributions")
      return
    }

    // Persist file selection immediately
    setEntries((prev) => {
      const next = [...prev]
      next[entryIndex] = {
        ...next[entryIndex],
        file,
        fileName: file.name,
        uploadProgress: 0,
      }
      return next
    })

    try {
      const current = entries[entryIndex]

      // Ensure the activity exists (get an id) then upload the file
      const saveResponse = await activitesApi.save({
        type: "enseignement",
        category,
        subcategory,
        count: current.count,
      })

      const uploadResponse = await documentsApi.uploadForActivite(
        saveResponse.activite.id,
        file,
        (percent) => {
          setEntries((prev) => {
            const next = [...prev]
            const idx = next.findIndex(
              (e) => e.category === category && e.subcategory === subcategory
            )
            if (idx < 0) return prev
            next[idx] = { ...next[idx], uploadProgress: percent }
            return next
          })
        }
      )

      setEntries((prev) => {
        const next = [...prev]
        const idx = next.findIndex(
          (e) => e.category === category && e.subcategory === subcategory
        )
        if (idx < 0) return prev
        next[idx] = {
          ...next[idx],
          // keep server-stored filename and clear local File to avoid re-upload
          file: undefined,
          fileName: uploadResponse.document.original_name,
          uploadProgress: undefined,
        }
        return next
      })

      toast.success("Fichier téléversé avec succès")
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.getAllErrors().join("\n")
          : "Erreur lors du téléversement"
      toast.error(message)

      setEntries((prev) => {
        const next = [...prev]
        const idx = next.findIndex(
          (e) => e.category === category && e.subcategory === subcategory
        )
        if (idx < 0) return prev
        next[idx] = { ...next[idx], uploadProgress: undefined }
        return next
      })
    }
  }

  const removeFile = (category: string, subcategory: string) => {
    const entryIndex = entries.findIndex(
      (e) => e.category === category && e.subcategory === subcategory
    )
    if (entryIndex >= 0) {
      const updated = [...entries]
      updated[entryIndex] = {
        ...updated[entryIndex],
        file: undefined,
        fileName: undefined,
        uploadProgress: undefined,
      }
      setEntries(updated)
    }
  }

  const getEntry = (category: string, subcategory: string) => {
    return entries.find(
      (e) => e.category === category && e.subcategory === subcategory
    )
  }

  const handleSubmit = async () => {
    const validEntries = entries.filter(isValidEntry)

    // Validate all entries have files
    const entriesWithoutFiles = validEntries.filter((e) => e.count > 0 && !isRealFile(e.file) && !e.fileName)
    if (entriesWithoutFiles.length > 0) {
      toast.error(
        "Veuillez téléverser les attestations PDF pour toutes les activités d'enseignement déclarées"
      )
      return
    }

    setLoading(true)
    try {
      // First save activities to get IDs
      const response = await activitesApi.bulkSave(
        "enseignement",
        validEntries.map(e => ({
          category: e.category,
          subcategory: e.subcategory,
          count: e.count,
        }))
      )

      // Upload files for each activity that has a new file
      for (const savedActivity of response.activites) {
        const localEntry = validEntries.find(
          e => e.category === savedActivity.category && e.subcategory === savedActivity.subcategory
        )
        if (localEntry && isRealFile(localEntry.file)) {
          await documentsApi.uploadForActivite(savedActivity.id, localEntry.file)
        }
      }

      clearDraft()
      toast.success("Activit\u00e9s d&apos;enseignement enregistr\u00e9es")
      router.push("/candidat/candidature/activites-recherche")
    } catch (error) {
      if (error instanceof ApiRequestError) {
        toast.error(error.message)
      } else {
        toast.error("Erreur lors de l&apos;enregistrement")
      }
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Étape 4 : Activités d&apos;enseignement</h1>
          <p className="text-muted-foreground mt-1">
            Déclarez vos activités d&apos;enseignement (A/1 – A/3).
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

      {Object.entries(ACTIVITIES).map(([category, subcategories]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{CATEGORY_TITLES[category] ?? category}</CardTitle>
            <CardDescription>
              Indiquez le nombre de contributions et téléversez les attestations visées.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subcategories.map((subcategory) => {
              const entry = getEntry(category, subcategory)
              const entryKey = `${category}-${subcategory}`

              return (
                <div
                  key={subcategory}
                  className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center"
                >
                  <div className="flex-1">
                    <Label className="font-medium">{subcategory}</Label>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24">
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={getEntryCount(category, subcategory) || ""}
                        onChange={(e) =>
                          updateEntry(category, subcategory, Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="w-64">
                      {entry?.fileName ? (
                        <div className="flex items-center gap-2 rounded-lg border bg-muted p-2">
                          <IconFile className="size-4 text-blue-600" />
                          <span className="flex-1 truncate text-sm">
                            {entry.fileName}
                          </span>
                          {entry.uploadProgress !== undefined && entry.uploadProgress < 100 ? (
                            <Progress value={entry.uploadProgress} className="w-16" />
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              onClick={() => removeFile(category, subcategory)}
                            >
                              <IconX className="size-4" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            ref={(el) => {
                              fileInputRefs.current[entryKey] = el
                            }}
                            onChange={(e) =>
                              handleFileChange(category, subcategory, e.target.files?.[0])
                            }
                          />
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled={getEntryCount(category, subcategory) === 0}
                            onClick={() => fileInputRefs.current[entryKey]?.click()}
                          >
                            <IconUpload className="mr-2 size-4" />
                            Attestation *
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}

      <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
        <CardContent className="pt-6">
          <p className="text-sm text-orange-600 dark:text-orange-400">
            <strong>Important:</strong> Les attestations doivent être visées par le chef
            d&apos;établissement. Format accepté: PDF (max 10 Mo).
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/candidat/candidature/pfe")}>
          Retour
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
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
    </div>
  )
}
