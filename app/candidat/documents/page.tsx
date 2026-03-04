"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import {
  IconEye,
  IconFileTypePdf,
  IconLoader2,
  IconTrash,
  IconDownload,
  IconFolder,
  IconUpload,
  IconCheck,
  IconFileDescription,
  IconAlertTriangle,
  IconRefresh,
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
import {
  documentsApi,
  generatedDocsApi,
  type CandidatureDocument,
  type GeneratedDocStatus,
  type GeneratedDocTypeKey,
  ApiRequestError,
}  from "@/lib/api"

const TYPE_LABELS: Record<string, string> = {
  profile_pdf: "Formulaire candidature",
  enseignements_pdf: "Récap. enseignements",
  pfe_pdf: "Récap. PFE",
  activite_attestation: "Attestations d'activités",
  signed_document: "Document signé",
  attestation_ens_pdf: "Attestation activités enseignement",
  attestation_rech_pdf: "Attestation activités recherche",
  signed_profile: "Formulaire signé",
  signed_enseignements: "Enseignements signé",
  signed_pfe: "PFE signé",
  signed_attestation_ens: "Att. enseignement signé",
  signed_attestation_rech: "Att. recherche signé",
}

const GENERATED_DOC_LABELS: Record<GeneratedDocTypeKey, string> = {
  profile: "Formulaire de demande de candidature",
  enseignements: "Récapitulatif des enseignements",
  pfe: "Récapitulatif des PFE encadrés",
  attestation_ens: "Attestation des activités d'enseignement",
  attestation_rech: "Attestation des activités de recherche",
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

  // Generated docs state
  const [generatedStatus, setGeneratedStatus] = useState<Record<string, GeneratedDocStatus>>({})
  const [generatingType, setGeneratingType] = useState<string | null>(null)
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [generatingAll, setGeneratingAll] = useState(false)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const [docsRes, statusRes] = await Promise.all([
        documentsApi.getAll(),
        generatedDocsApi.getStatus(),
      ])
      setDocuments(docsRes.documents)
      setGeneratedStatus(statusRes.status)
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

  // Filter out generated/signed types from the manual upload document list
  const manualDocuments = useMemo(() => {
    const generatedAndSignedTypes = new Set([
      "profile_pdf", "enseignements_pdf", "pfe_pdf",
      "attestation_ens_pdf", "attestation_rech_pdf",
      "signed_profile", "signed_enseignements", "signed_pfe",
      "signed_attestation_ens", "signed_attestation_rech",
    ])
    return documents.filter((d) => !generatedAndSignedTypes.has(d.type))
  }, [documents])

  const groupedDocuments = useMemo(() => {
    const groups: Record<string, CandidatureDocument[]> = {}
    for (const doc of manualDocuments) {
      if (!groups[doc.type]) groups[doc.type] = []
      groups[doc.type].push(doc)
    }
    return groups
  }, [manualDocuments])

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

  // === Generated docs handlers ===

  const handleGenerateAndStore = useCallback(async (type: GeneratedDocTypeKey) => {
    setGeneratingType(type)
    try {
      await generatedDocsApi.generateAndStore(type)
      toast.success("Document généré avec succès")
      // Reload status
      const statusRes = await generatedDocsApi.getStatus()
      setGeneratedStatus(statusRes.status)
    } catch (error) {
      if (error instanceof ApiRequestError) toast.error(error.message)
      else toast.error("Erreur lors de la génération")
    } finally {
      setGeneratingType(null)
    }
  }, [])

  const handleGenerateAll = useCallback(async () => {
    setGeneratingAll(true)
    try {
      await generatedDocsApi.generateAll()
      toast.success("Tous les documents ont été générés")
      const statusRes = await generatedDocsApi.getStatus()
      setGeneratedStatus(statusRes.status)
    } catch (error) {
      if (error instanceof ApiRequestError) toast.error(error.message)
      else toast.error("Erreur lors de la génération")
    } finally {
      setGeneratingAll(false)
    }
  }, [])

  const handlePreviewGenerated = useCallback(async (type: GeneratedDocTypeKey) => {
    try {
      const blob = await generatedDocsApi.preview(type)
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank", "noopener,noreferrer")
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      if (error instanceof ApiRequestError) toast.error(error.message)
      else toast.error("Erreur de prévisualisation")
    }
  }, [])

  const handleDownloadGenerated = useCallback(async (type: GeneratedDocTypeKey) => {
    try {
      const blob = await generatedDocsApi.preview(type)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${type}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      if (error instanceof ApiRequestError) toast.error(error.message)
      else toast.error("Erreur de téléchargement")
    }
  }, [])

  const handleUploadSigned = useCallback(async (type: GeneratedDocTypeKey, file: File) => {
    setUploadingType(type)
    try {
      await generatedDocsApi.uploadSigned(type, file)
      toast.success("Document signé téléversé")
      const statusRes = await generatedDocsApi.getStatus()
      setGeneratedStatus(statusRes.status)
    } catch (error) {
      if (error instanceof ApiRequestError) toast.error(error.message)
      else toast.error("Erreur lors du téléversement")
    } finally {
      setUploadingType(null)
    }
  }, [])

  const handleDeleteSigned = useCallback(async (type: GeneratedDocTypeKey) => {
    try {
      await generatedDocsApi.deleteSigned(type)
      toast.success("Document signé supprimé")
      const statusRes = await generatedDocsApi.getStatus()
      setGeneratedStatus(statusRes.status)
    } catch (error) {
      if (error instanceof ApiRequestError) toast.error(error.message)
      else toast.error("Erreur lors de la suppression")
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <IconLoader2 className="size-8 animate-spin" />
      </div>
    )
  }

  const genDocKeys = Object.keys(GENERATED_DOC_LABELS) as GeneratedDocTypeKey[]

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Mes documents</h1>
        <p className="mt-1 text-muted-foreground">
          Documents générés, documents signés et fichiers téléversés.
        </p>
      </div>

      {/* ==================== GENERATED DOCUMENTS ZONE ==================== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconFileDescription className="size-5" />
                Documents générés
              </CardTitle>
              <CardDescription>
                Générez vos documents officiels, téléchargez-les, faites-les légaliser puis re-téléversez les versions signées.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAll}
              disabled={generatingAll}
            >
              {generatingAll ? (
                <IconLoader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <IconRefresh className="mr-1 size-4" />
              )}
              Tout générer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {genDocKeys.map((typeKey) => {
            const status = generatedStatus[typeKey]
            const label = GENERATED_DOC_LABELS[typeKey]
            const isGenerating = generatingType === typeKey
            const isUploading = uploadingType === typeKey

            return (
              <div
                key={typeKey}
                className="rounded-lg border p-4 space-y-3"
              >
                {/* Document row header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconFileTypePdf className="size-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      {status?.generated ? (
                        <p className="text-xs text-muted-foreground">
                          Généré le {formatDate(status.generated.created_at)} — {formatBytes(status.generated.size)}
                        </p>
                      ) : (
                        <p className="text-xs text-yellow-600">Non encore généré</p>
                      )}
                    </div>
                  </div>

                  {/* Actions for generating */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewGenerated(typeKey)}
                    >
                      <IconEye className="mr-1 size-4" />
                      Aperçu
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadGenerated(typeKey)}
                    >
                      <IconDownload className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleGenerateAndStore(typeKey)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <IconLoader2 className="mr-1 size-4 animate-spin" />
                      ) : (
                        <IconRefresh className="mr-1 size-4" />
                      )}
                      {status?.generated ? "Régénérer" : "Générer"}
                    </Button>
                  </div>
                </div>

                {/* Signed upload zone */}
                <div className="ml-8 rounded-md border border-dashed p-3 bg-muted/30">
                  {status?.signed ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconCheck className="size-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-700">Version signée téléversée</p>
                          <p className="text-xs text-muted-foreground">
                            {status.signed.original_name} — {formatBytes(status.signed.size)} — {formatDate(status.signed.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            if (status.signed) {
                              handleDownload({ id: status.signed.id, original_name: status.signed.original_name } as CandidatureDocument)
                            }
                          }}
                        >
                          <IconDownload className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteSigned(typeKey)}
                        >
                          <IconTrash className="size-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconAlertTriangle className="size-4 text-amber-500" />
                        <p className="text-sm text-muted-foreground">
                          Téléversez la version signée/légalisée
                        </p>
                      </div>
                      <div>
                        <input
                          ref={(el) => { fileInputRefs.current[typeKey] = el }}
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleUploadSigned(typeKey, file)
                            e.target.value = ""
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRefs.current[typeKey]?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <IconLoader2 className="mr-1 size-4 animate-spin" />
                          ) : (
                            <IconUpload className="mr-1 size-4" />
                          )}
                          Téléverser signé
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* ==================== MANUAL UPLOADS ==================== */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Autres documents téléversés</h2>
        {manualDocuments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <IconFolder className="size-10 text-muted-foreground" />
              <p className="font-medium">Aucun document supplémentaire</p>
              <p className="text-sm text-muted-foreground">
                Les justificatifs d'activités apparaîtront ici.
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
      </div>

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
