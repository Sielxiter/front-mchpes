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
  "B/1": "B/1 - Production scientifique",
  "B/2": "B/2 - Encadrement scientifique",
  "B/3": "B/3 - Responsabilités scientifiques",
  "B/4": "B/4 - Rayonnement, innovation et valorisation",
}

// Must match backend validation in ActiviteController::RECHERCHE_CATEGORIES
const RESEARCH_ACTIVITIES: Record<string, string[]> = {
  "B/1": [
    "Publication dans une revue indexée",
    "Brevet déposé ou exploité",
    "Direction de thèse soutenue",
    "Co-direction de thèse soutenue",
  ],
  "B/2": [
    "Publication dans les actes de congrès indexés",
    "Publication dans une revue spécialisée non indexée",
    "Direction de thèses en cours d'un doctorant inscrit",
  ],
  "B/3": [
    "Participation à des projets de recherche financés (CNRST, International...)",
    "Création ou participation à la création d'une structure de recherche accréditée",
    "Communication orale ou poster dans un congrès",
  ],
  "B/4": [
    "Responsabilité de structure de recherche accréditée comme directeur",
    "Responsabilité de structure de recherche accréditée comme chef d'équipe",
    "Rédaction de rapports d'expertise ou de rapports techniques",
    "Évaluation d'articles scientifiques (reviewer)",
  ],
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ["application/pdf"]

export default function ActivitesRecherchePage() {
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
  } = useLocalDraftArray<ActivityEntry>("activites_recherche", [])
  
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const isRealFile = (value: unknown): value is File => {
    return typeof File !== "undefined" && value instanceof File
  }

  const isValidEntry = useCallback((entry: ActivityEntry) => {
    const allowed = RESEARCH_ACTIVITIES[entry.category]
    return Array.isArray(allowed) && allowed.includes(entry.subcategory)
  }, [])

  // Load from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await activitesApi.getAll("recherche")
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
        "recherche",
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

      const saveResponse = await activitesApi.save({
        type: "recherche",
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

    const entriesWithoutFiles = validEntries.filter((e) => e.count > 0 && !isRealFile(e.file) && !e.fileName)
    if (entriesWithoutFiles.length > 0) {
      toast.error(
        "Veuillez téléverser les justificatifs PDF pour toutes les activités de recherche déclarées"
      )
      return
    }

    setLoading(true)
    try {
      // First save activities to get IDs
      const response = await activitesApi.bulkSave(
        "recherche",
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
      toast.success("Activit\u00e9s de recherche enregistr\u00e9es")
      router.push("/candidat/candidature/validation")
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
          <h1 className="text-3xl font-bold">Étape 5 : Activités de recherche</h1>
          <p className="text-muted-foreground mt-1">
            Déclarez vos activités de recherche (B/1 – B/4).
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

      {Object.entries(RESEARCH_ACTIVITIES).map(([category, subcategories]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{CATEGORY_TITLES[category] ?? category}</CardTitle>
            <CardDescription>
              Indiquez le nombre de contributions et téléversez les justificatifs.
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
                            Justificatif *
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
            <strong>Important:</strong> Les justificatifs sont obligatoires (*). Formats
            acceptés: PDF (max 10 Mo).
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/candidat/candidature/activites-enseignement")}
        >
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
