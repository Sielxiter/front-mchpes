"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  IconCheck,
  IconLoader2,
  IconFile,
  IconX,
  IconAlertTriangle,
  IconCloudUpload,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { activitesApi, documentsApi, ApiRequestError } from "@/lib/api"
import { useLocalDraftArray } from "@/hooks/use-local-draft"

interface UploadedFile {
  id?: number
  file?: File
  fileName: string
  uploadProgress?: number
}

interface ActivityEntry {
  id: string
  category: string
  subcategory: string
  count: number
  files: UploadedFile[]
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ["application/pdf"]

export interface ActivityCategoryPageProps {
  /** "enseignement" | "recherche" */
  type: "enseignement" | "recherche"
  /** The category key e.g. "A/1", "B/2" */
  category: string
  /** Display title for the category */
  categoryTitle: string
  /** Subcategories (activity names) */
  subcategories: string[]
  /** localStorage draft key suffix */
  draftKey: string
  /** Back URL */
  backUrl: string
  /** Next URL */
  nextUrl: string
  /** Step title */
  stepTitle: string
  /** Step description */
  stepDescription: string
}

export default function ActivityCategoryPage({
  type,
  category,
  categoryTitle,
  subcategories,
  draftKey,
  backUrl,
  nextUrl,
  stepTitle,
  stepDescription,
}: ActivityCategoryPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showMismatchWarning, setShowMismatchWarning] = useState(false)
  const [mismatchDetails, setMismatchDetails] = useState<
    { subcategory: string; count: number; files: number }[]
  >([])

  const {
    items: entries,
    setItems: setEntries,
    clearDraft,
    lastSaved,
  } = useLocalDraftArray<ActivityEntry>(draftKey, [])

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const isRealFile = (value: unknown): value is File =>
    typeof File !== "undefined" && value instanceof File

  // Load from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [activitesResponse, docsResponse] = await Promise.all([
          activitesApi.getAll(type),
          documentsApi.getAll(),
        ])

        // Filter activities for this category
        const categoryActivites = activitesResponse.activites.filter(
          (a) => a.category === category
        )

        if (categoryActivites.length > 0) {
          // Group documents by activite_id
          const docsByActivite: Record<number, typeof docsResponse.documents> = {}
          for (const doc of docsResponse.documents) {
            if (doc.activite_id) {
              if (!docsByActivite[doc.activite_id]) docsByActivite[doc.activite_id] = []
              docsByActivite[doc.activite_id].push(doc)
            }
          }

          setEntries(
            categoryActivites.map((a) => ({
              id: String(a.id),
              category: a.category,
              subcategory: a.subcategory,
              count: a.count,
              files: (docsByActivite[a.id] || []).map((d) => ({
                id: d.id,
                fileName: d.original_name,
              })),
            }))
          )
        }
      } catch {
        // Fallback to localStorage draft
      } finally {
        setInitialLoading(false)
      }
    }
    loadData()
  }, [type, category, setEntries])

  // Auto-save
  const autoSave = useCallback(async () => {
    const validEntries = entries.filter(
      (e) => e.category === category && subcategories.includes(e.subcategory)
    )
    if (validEntries.length === 0) return
    const hasPending = entries.some((e) => e.files.some((f) => f.uploadProgress !== undefined))
    if (hasPending) return

    setSaving(true)
    try {
      await activitesApi.bulkSave(
        type,
        validEntries.map((e) => ({
          category: e.category,
          subcategory: e.subcategory,
          count: e.count,
        }))
      )
    } catch {
      // Silent fail
    } finally {
      setSaving(false)
    }
  }, [entries, type, category, subcategories])

  useEffect(() => {
    if (initialLoading) return
    const timer = setTimeout(() => {
      if (entries.length > 0) autoSave()
    }, 3000)
    return () => clearTimeout(timer)
  }, [entries, autoSave, initialLoading])

  const updateEntry = (sub: string, count: number) => {
    const idx = entries.findIndex((e) => e.category === category && e.subcategory === sub)
    if (idx >= 0) {
      if (count === 0) {
        setEntries(entries.filter((_, i) => i !== idx))
      } else {
        const updated = [...entries]
        updated[idx] = { ...updated[idx], count }
        setEntries(updated)
      }
    } else if (count > 0) {
      setEntries([
        ...entries,
        { id: crypto.randomUUID(), category, subcategory: sub, count, files: [] },
      ])
    }
  }

  const getEntry = (sub: string) =>
    entries.find((e) => e.category === category && e.subcategory === sub)

  const getEntryCount = (sub: string) => getEntry(sub)?.count || 0

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) return "Fichier trop volumineux (max 10 Mo)"
    if (!ALLOWED_TYPES.includes(file.type)) return "PDF uniquement"
    return null
  }

  const handleFileAdd = async (sub: string, file: File) => {
    const error = validateFile(file)
    if (error) {
      toast.error(error)
      return
    }

    const entryIdx = entries.findIndex((e) => e.category === category && e.subcategory === sub)
    if (entryIdx < 0) {
      toast.error("Veuillez d'abord indiquer le nombre de contributions")
      return
    }

    // Add file to entry's files array with progress
    const newFile: UploadedFile = { file, fileName: file.name, uploadProgress: 0 }
    const fileIdx = entries[entryIdx].files.length

    setEntries((prev) => {
      const next = [...prev]
      next[entryIdx] = { ...next[entryIdx], files: [...next[entryIdx].files, newFile] }
      return next
    })

    try {
      // Ensure activity exists in backend
      const saveResponse = await activitesApi.save({
        type,
        category,
        subcategory: sub,
        count: entries[entryIdx].count,
      })

      const uploadResponse = await documentsApi.uploadForActivite(
        saveResponse.activite.id,
        file,
        (percent) => {
          setEntries((prev) => {
            const next = [...prev]
            const eIdx = next.findIndex((e) => e.category === category && e.subcategory === sub)
            if (eIdx < 0) return prev
            const files = [...next[eIdx].files]
            files[fileIdx] = { ...files[fileIdx], uploadProgress: percent }
            next[eIdx] = { ...next[eIdx], files }
            return next
          })
        }
      )

      setEntries((prev) => {
        const next = [...prev]
        const eIdx = next.findIndex((e) => e.category === category && e.subcategory === sub)
        if (eIdx < 0) return prev
        const files = [...next[eIdx].files]
        files[fileIdx] = {
          id: uploadResponse.document.id,
          fileName: uploadResponse.document.original_name,
          file: undefined,
          uploadProgress: undefined,
        }
        next[eIdx] = { ...next[eIdx], files }
        return next
      })

      toast.success("Fichier téléversé")
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.getAllErrors().join("\n") : "Erreur de téléversement"
      toast.error(message)

      // Remove the failed file
      setEntries((prev) => {
        const next = [...prev]
        const eIdx = next.findIndex((e) => e.category === category && e.subcategory === sub)
        if (eIdx < 0) return prev
        const files = next[eIdx].files.filter((_, i) => i !== fileIdx)
        next[eIdx] = { ...next[eIdx], files }
        return next
      })
    }
  }

  const removeFile = async (sub: string, fileIndex: number) => {
    const entryIdx = entries.findIndex((e) => e.category === category && e.subcategory === sub)
    if (entryIdx < 0) return

    const fileToRemove = entries[entryIdx].files[fileIndex]

    // Delete from server if it has an ID
    if (fileToRemove.id) {
      try {
        await documentsApi.delete(fileToRemove.id)
      } catch {
        toast.error("Erreur lors de la suppression")
        return
      }
    }

    setEntries((prev) => {
      const next = [...prev]
      const files = next[entryIdx].files.filter((_, i) => i !== fileIndex)
      next[entryIdx] = { ...next[entryIdx], files }
      return next
    })
    toast.success("Fichier supprimé")
  }

  const handleSubmit = async () => {
    const validEntries = entries.filter(
      (e) => e.category === category && subcategories.includes(e.subcategory) && e.count > 0
    )

    // Check for count / files mismatch
    const mismatches = validEntries
      .filter((e) => e.files.filter((f) => f.fileName && !isRealFile(f.file)).length !== e.count)
      .map((e) => ({
        subcategory: e.subcategory,
        count: e.count,
        files: e.files.filter((f) => f.fileName && !isRealFile(f.file)).length,
      }))

    if (mismatches.length > 0) {
      setMismatchDetails(mismatches)
      setShowMismatchWarning(true)
      return
    }

    await doSubmit(validEntries)
  }

  const doSubmit = async (validEntries: ActivityEntry[]) => {
    setLoading(true)
    try {
      await activitesApi.bulkSave(
        type,
        validEntries.map((e) => ({
          category: e.category,
          subcategory: e.subcategory,
          count: e.count,
        }))
      )
      clearDraft()
      toast.success("Activités enregistrées")
      router.push(nextUrl)
    } catch (err) {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error("Erreur lors de l'enregistrement")
    } finally {
      setLoading(false)
    }
  }

  const handleForceSubmit = async () => {
    setShowMismatchWarning(false)
    const validEntries = entries.filter(
      (e) => e.category === category && subcategories.includes(e.subcategory) && e.count > 0
    )
    await doSubmit(validEntries)
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
          <h1 className="text-3xl font-bold">{stepTitle}</h1>
          <p className="text-muted-foreground mt-1">{stepDescription}</p>
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

      <Card>
        <CardHeader>
          <CardTitle>{categoryTitle}</CardTitle>
          <CardDescription>
            Indiquez le nombre de contributions et téléversez les justificatifs correspondants.
            Le nombre de fichiers doit correspondre au compteur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {subcategories.map((sub) => {
            const entry = getEntry(sub)
            const entryKey = `${category}-${sub}`
            const count = getEntryCount(sub)
            const fileCount = entry?.files.length || 0

            return (
              <div key={sub} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex-1">
                    <Label className="font-medium">{sub}</Label>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24">
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={count || ""}
                        onChange={(e) => updateEntry(sub, Number(e.target.value))}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {fileCount}/{count || 0} fichier(s)
                    </span>
                  </div>
                </div>

                {/* Uploaded files list */}
                {entry && entry.files.length > 0 && (
                  <div className="space-y-2 pl-0 md:pl-4">
                    {entry.files.map((f, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex items-center gap-2 rounded-lg border bg-muted p-2"
                      >
                        <IconFile className="size-4 text-blue-600 shrink-0" />
                        <span className="flex-1 truncate text-sm">{f.fileName}</span>
                        {f.uploadProgress !== undefined && f.uploadProgress < 100 ? (
                          <Progress value={f.uploadProgress} className="w-16" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={() => removeFile(sub, fIdx)}
                          >
                            <IconX className="size-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Drag & drop zone for adding more files */}
                {count > 0 && (
                  <div className="pl-0 md:pl-4">
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      ref={(el) => { fileInputRefs.current[entryKey] = el }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileAdd(sub, file)
                        e.target.value = ""
                      }}
                    />
                    <div
                      onClick={() => fileInputRefs.current[entryKey]?.click()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const file = e.dataTransfer.files?.[0]
                        if (file) handleFileAdd(sub, file)
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      className="rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition hover:border-primary/50 border-muted-foreground/25"
                    >
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <IconCloudUpload className="size-5 text-primary" />
                        <span>Glissez ou cliquez pour ajouter un justificatif PDF</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
        <CardContent className="pt-6">
          <p className="text-sm text-orange-600 dark:text-orange-400">
            <strong>Important:</strong> Les justificatifs sont obligatoires. Le nombre de fichiers
            doit correspondre au compteur déclaré. Format: PDF (max 10 Mo).
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push(backUrl)}>
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

      {/* Mismatch Warning Dialog */}
      <Dialog open={showMismatchWarning} onOpenChange={setShowMismatchWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconAlertTriangle className="size-5 text-orange-500" />
              Nombre de fichiers incomplet
            </DialogTitle>
            <DialogDescription>
              Le nombre de justificatifs téléversés ne correspond pas au compteur déclaré pour
              les activités suivantes :
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {mismatchDetails.map((m, i) => (
              <div key={i} className="flex items-start gap-2 rounded border p-3 text-sm">
                <IconAlertTriangle className="size-4 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{m.subcategory}</p>
                  <p className="text-muted-foreground">
                    Déclaré: {m.count} — Fichiers: {m.files}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowMismatchWarning(false)}>
              Corriger
            </Button>
            <Button variant="destructive" onClick={handleForceSubmit}>
              Continuer quand même
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
