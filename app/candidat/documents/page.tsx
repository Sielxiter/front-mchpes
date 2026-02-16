"use client"

import { useEffect, useMemo, useState } from "react"
import {
  IconEye,
  IconFileTypePdf,
  IconLoader2,
  IconTrash,
  IconDownload,
  IconFolder,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { documentsApi, type CandidatureDocument, ApiRequestError } from "@/lib/api"

const TYPE_LABELS: Record<string, string> = {
  profile_pdf: "CV",
  enseignements_pdf: "Enseignements",
  pfe_pdf: "PFE",
  activite_attestation: "Attestations d'activités",
  signed_document: "Document signé",
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR")
}

export default function CandidatDocumentsPage() {
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<CandidatureDocument[]>([])
  const [activeDoc, setActiveDoc] = useState<CandidatureDocument | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const response = await documentsApi.getAll()
      setDocuments(response.documents)
    } catch (error) {
      if (error instanceof ApiRequestError) {
        toast.error(error.message)
      } else {
        toast.error("Impossible de charger les documents")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const groupedDocuments = useMemo(() => {
    const groups: Record<string, CandidatureDocument[]> = {}
    for (const doc of documents) {
      if (!groups[doc.type]) {
        groups[doc.type] = []
      }
      groups[doc.type].push(doc)
    }
    return groups
  }, [documents])

  const handleDelete = async (id: number) => {
    try {
      await documentsApi.delete(id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      if (activeDoc?.id === id) {
        setPreviewOpen(false)
        setActiveDoc(null)
      }
      toast.success("Document supprimé")
    } catch (error) {
      if (error instanceof ApiRequestError) {
        toast.error(error.message)
      } else {
        toast.error("Erreur lors de la suppression")
      }
    }
  }

  const handleDownload = async (doc: CandidatureDocument) => {
    try {
      const blob = await documentsApi.download(doc.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = doc.original_name
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error("Erreur lors du téléchargement")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <IconLoader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Mes documents</h1>
        <p className="mt-1 text-muted-foreground">
          Tous vos fichiers PDF téléversés sont organisés par catégorie.
        </p>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <IconFolder className="size-10 text-muted-foreground" />
            <p className="font-medium">Aucun document disponible</p>
            <p className="text-sm text-muted-foreground">
              Téléversez vos documents depuis les étapes de candidature.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDocuments).map(([type, docs]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle>{TYPE_LABELS[type] ?? type}</CardTitle>
                <CardDescription>{docs.length} document(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {docs.map((doc) => (
                    <Card key={doc.id} className="border-muted">
                      <CardContent className="space-y-3 pt-6">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-start gap-2">
                            <IconFileTypePdf className="mt-0.5 size-5 shrink-0 text-primary" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{doc.original_name}</p>
                              <p className="text-xs text-muted-foreground">{formatBytes(doc.size)}</p>
                            </div>
                          </div>
                          <Badge variant={doc.is_verified ? "default" : "secondary"}>
                            {doc.is_verified ? "Vérifié" : "En attente"}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Ajouté le {formatDate(doc.created_at)}
                        </p>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setActiveDoc(doc)
                              setPreviewOpen(true)
                            }}
                          >
                            <IconEye className="mr-2 size-4" />
                            Voir
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDownload(doc)}>
                            <IconDownload className="size-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(doc.id)}>
                            <IconTrash className="size-4 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle className="truncate">{activeDoc?.original_name}</DialogTitle>
            <DialogDescription>
              Prévisualisation PDF intégrée
            </DialogDescription>
          </DialogHeader>

          {activeDoc ? (
            <div className="space-y-3">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDownload(activeDoc)}>
                  <IconDownload className="mr-2 size-4" />
                  Télécharger
                </Button>
              </div>
              <div className="h-[70vh] overflow-hidden rounded-md border">
                <iframe
                  title={activeDoc.original_name}
                  src={`${documentsApi.getPreviewUrl(activeDoc.id)}#toolbar=0&navpanes=0`}
                  className="h-full w-full"
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
