"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { IconCheck, IconLoader2, IconPlus, IconTrash, IconUpload, IconFile, IconX, IconCloudUpload } from "@tabler/icons-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { pfesApi, documentsApi, ApiRequestError } from "@/lib/api"
import { useLocalDraftArray } from "@/hooks/use-local-draft"

interface PFE {
  id: string
  annee_universitaire: string
  intitule: string
  niveau: string
  volume_horaire: number
}

interface UploadedDoc {
  id: number
  original_name: string
  mime_type: string
  size: number
}

const NIVEAUX = ["DUT", "Licence", "Master", "Ingénieur", "Doctorat", "Autre"]
const ANNEES = Array.from({ length: 20 }, (_, i) => {
  const year = 2026 - i
  return `${year - 1}/${year}`
})

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["application/pdf"]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export default function PFEPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Upload state
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Use localStorage for draft persistence
  const { 
    items: pfes, 
    setItems: setPfes, 
    clearDraft,
    lastSaved 
  } = useLocalDraftArray<PFE>("pfes", [])
  
  const [newEntry, setNewEntry] = useState<Partial<PFE>>({
    annee_universitaire: ANNEES[0],
    niveau: "Licence",
  })

  // Load from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [pfeResponse, docsResponse] = await Promise.all([
          pfesApi.getAll(),
          documentsApi.getAll("pfe_pdf"),
        ])
        if (pfeResponse.pfes.length > 0) {
          setPfes(pfeResponse.pfes.map(p => ({
            id: String(p.id),
            annee_universitaire: p.annee_universitaire,
            intitule: p.intitule,
            niveau: p.niveau,
            volume_horaire: p.volume_horaire,
          })))
        }
        if (docsResponse.documents.length > 0) {
          setUploadedDocs(docsResponse.documents.map(d => ({
            id: d.id,
            original_name: d.original_name,
            mime_type: d.mime_type,
            size: d.size,
          })))
        }
      } catch {
        // API failed, will use localStorage draft
      } finally {
        setInitialLoading(false)
      }
    }
    loadData()
  }, [setPfes])

  const autoSave = useCallback(async () => {
    if (pfes.length === 0) return
    setSaving(true)
    try {
      await pfesApi.bulkSave(
        pfes.map(p => ({
          annee_universitaire: p.annee_universitaire,
          intitule: p.intitule,
          niveau: p.niveau as "DUT" | "Licence" | "Master" | "Ingénieur" | "Doctorat" | "Autre",
          volume_horaire: Math.trunc(p.volume_horaire),
        }))
      )
    } catch {
      // Silent fail
    } finally {
      setSaving(false)
    }
  }, [pfes])

  useEffect(() => {
    if (initialLoading) return
    const timer = setTimeout(() => {
      if (pfes.length > 0) {
        autoSave()
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [pfes, autoSave, initialLoading])

  const addPFE = () => {
    if (!newEntry.intitule || !newEntry.volume_horaire) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    const hours = Number.parseInt(String(newEntry.volume_horaire), 10)
    if (!Number.isFinite(hours) || hours < 1) {
      toast.error("Le volume horaire doit être un entier supérieur à 0")
      return
    }

    const entry: PFE = {
      id: crypto.randomUUID(),
      annee_universitaire: newEntry.annee_universitaire || ANNEES[0],
      intitule: newEntry.intitule || "",
      niveau: newEntry.niveau || "Licence",
      volume_horaire: hours,
    }

    setPfes([...pfes, entry])
    setNewEntry({
      annee_universitaire: newEntry.annee_universitaire,
      niveau: "Licence",
      intitule: "",
      volume_horaire: undefined,
    })
    toast.success("PFE ajouté")
  }

  const removePFE = (id: string) => {
    setPfes(pfes.filter((p) => p.id !== id))
    toast.success("PFE supprimé")
  }

  // —— File upload helpers —— //
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Seuls les fichiers PDF sont acceptés"
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Le fichier ne doit pas dépasser 10 Mo"
    }
    return null
  }

  const handleUpload = async (file: File) => {
    const error = validateFile(file)
    if (error) {
      toast.error(error)
      return
    }

    setUploading(true)
    setUploadProgress(0)
    try {
      const result = await documentsApi.upload(file, "pfe_pdf", (percent) => {
        setUploadProgress(percent)
      })
      setUploadedDocs(prev => [...prev, {
        id: result.document.id,
        original_name: result.document.original_name,
        mime_type: result.document.mime_type,
        size: result.document.size,
      }])
      toast.success("Document téléversé avec succès")
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.message)
      } else {
        toast.error("Erreur lors du téléversement")
      }
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteDoc = async (docId: number) => {
    try {
      await documentsApi.delete(docId)
      setUploadedDocs(prev => prev.filter(d => d.id !== docId))
      toast.success("Document supprimé")
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleUpload(files[0])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
    // Reset so re-selecting the same file works
    e.target.value = ""
  }

  const totalVolumeHoraire = pfes.reduce((sum, p) => sum + p.volume_horaire, 0)

  const handleSubmit = async () => {
    if (pfes.length === 0) {
      toast.error("Veuillez ajouter au moins un encadrement PFE")
      return
    }

    if (uploadedDocs.length === 0) {
      toast.error("Veuillez téléverser au moins un justificatif PFE en PDF")
      return
    }

    setLoading(true)
    try {
      await pfesApi.bulkSave(
        pfes.map(p => ({
          annee_universitaire: p.annee_universitaire,
          intitule: p.intitule,
          niveau: p.niveau as "DUT" | "Licence" | "Master" | "Ingénieur" | "Doctorat" | "Autre",
          volume_horaire: Math.trunc(p.volume_horaire),
        }))
      )
      clearDraft()
      toast.success("PFE enregistrés")
      router.push("/candidat/candidature/activites-enseignement")
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
          <h1 className="text-3xl font-bold">Étape 3 : Encadrement des PFE</h1>
          <p className="text-muted-foreground mt-1">
            Listez les projets de fin d'études que vous avez encadrés.
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

      <Card>
        <CardHeader>
          <CardTitle>Ajouter un PFE</CardTitle>
          <CardDescription>
            Renseignez les détails de chaque projet de fin d'études encadré.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Année universitaire</Label>
              <Select
                value={newEntry.annee_universitaire}
                onValueChange={(v) => setNewEntry({ ...newEntry, annee_universitaire: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANNEES.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Niveau</Label>
              <Select
                value={newEntry.niveau}
                onValueChange={(v) => setNewEntry({ ...newEntry, niveau: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NIVEAUX.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Intitulé du PFE</Label>
              <Input
                placeholder="Titre du projet"
                value={newEntry.intitule || ""}
                onChange={(e) => setNewEntry({ ...newEntry, intitule: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Volume horaire</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Heures"
                  value={newEntry.volume_horaire || ""}
                  onChange={(e) =>
                    setNewEntry({
                      ...newEntry,
                      volume_horaire: Number.parseInt(e.target.value || "", 10),
                    })
                  }
                />
                <Button onClick={addPFE}>
                  <IconPlus className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {pfes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>PFE déclarés</CardTitle>
            <CardDescription>
              Total: {pfes.length} PFE | {totalVolumeHoraire} heures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Année</TableHead>
                    <TableHead>Intitulé</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead className="text-right">Vol. horaire</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pfes.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.annee_universitaire}</TableCell>
                      <TableCell>{p.intitule}</TableCell>
                      <TableCell>{p.niveau}</TableCell>
                      <TableCell className="text-right">{p.volume_horaire}h</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removePFE(p.id)}>
                          <IconTrash className="size-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="text-right font-bold">{totalVolumeHoraire}h</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Justificatifs PFE</CardTitle>
          <CardDescription>
            Téléversez les attestations d'encadrement de PFE (format PDF, 10 Mo max par fichier).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag & drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-xl border-2 border-dashed
              transition-all duration-200
              ${dragOver
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              }
              ${uploading ? "pointer-events-none opacity-60" : ""}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={onFileSelect}
            />

            <div className="flex flex-col items-center justify-center gap-3 py-10 px-6">
              {uploading ? (
                <>
                  <IconLoader2 className="size-10 animate-spin text-primary" />
                  <div className="w-full max-w-xs space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-center text-sm text-muted-foreground">
                      Téléversement… {uploadProgress}%
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-primary/10 p-4">
                    <IconCloudUpload className="size-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">
                      Glissez-déposez votre fichier PDF ici
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ou <span className="text-primary underline underline-offset-2">parcourez vos fichiers</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">PDF uniquement — 10 Mo max</p>
                </>
              )}
            </div>
          </div>

          {/* Uploaded files list */}
          {uploadedDocs.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {uploadedDocs.length} document{uploadedDocs.length > 1 ? "s" : ""} téléversé{uploadedDocs.length > 1 ? "s" : ""}
              </p>
              <div className="divide-y rounded-lg border">
                {uploadedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                      <IconFile className="size-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{doc.original_name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(doc.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteDoc(doc.id)
                      }}
                    >
                      <IconX className="size-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <strong>Note:</strong> Un PDF récapitulatif avec déclaration sur l'honneur sera généré.
            Vous devrez le signer et le téléverser.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/candidat/candidature/enseignements")}>
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
