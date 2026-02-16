"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PdfList } from "@/components/dossier/pdf-list"
import { PdfViewer } from "@/components/dossier/pdf-viewer"

import {
  AdminApiError,
  dossiersAdminApi,
  type AdminDossier,
  type AdminDossierDocument,
} from "@/lib/api"

type Meta = { page: number; per_page: number; total: number; last_page: number }

export default function Page() {
  const params = useParams<{ id?: string | string[] }>()
  const idParam = params?.id
  const id = Array.isArray(idParam) ? idParam[0] : idParam
  const candidatureId = Number(id)

  const [loadingDossier, setLoadingDossier] = useState(true)
  const [dossier, setDossier] = useState<AdminDossier | null>(null)

  const [loadingDocs, setLoadingDocs] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [docs, setDocs] = useState<AdminDossierDocument[]>([])
  const [docsMeta, setDocsMeta] = useState<Meta | null>(null)

  const [selectedDocId, setSelectedDocId] = useState<number | null>(null)

  const bytesCacheRef = useRef(new Map<number, ArrayBuffer>())

  const title = useMemo(() => {
    if (!dossier) return `Dossier #${id ?? ""}`
    const name = dossier.candidate?.name
    return name ? `Dossier #${dossier.id} — ${name}` : `Dossier #${dossier.id}`
  }, [dossier, id])

  const fetchPdfBytes = useCallback(async (documentId: number, signal: AbortSignal) => {
    const cached = bytesCacheRef.current.get(documentId)
    if (cached) return cached

    const bytes = await dossiersAdminApi.downloadDocumentBytes(documentId, signal)
    bytesCacheRef.current.set(documentId, bytes)
    return bytes
  }, [])

  const loadDossier = useCallback(async () => {
    if (!Number.isFinite(candidatureId)) {
      toast.error("ID dossier invalide")
      return
    }

    setLoadingDossier(true)
    try {
      const res = await dossiersAdminApi.getById(candidatureId)
      setDossier(res.data)
    } catch (error) {
      if (error instanceof AdminApiError) {
        toast.error(error.message)
      } else {
        toast.error("Erreur lors du chargement du dossier")
      }
      setDossier(null)
    } finally {
      setLoadingDossier(false)
    }
  }, [candidatureId])

  const loadDocumentsPage = useCallback(
    async (page: number) => {
      if (!Number.isFinite(candidatureId)) return

      if (page === 1) {
        setLoadingDocs(true)
      } else {
        setLoadingMore(true)
      }

      try {
        const res = await dossiersAdminApi.getDocuments(candidatureId, {
          page,
          per_page: 20,
        })

        setDocs((prev) => (page === 1 ? res.data : [...prev, ...res.data]))
        setDocsMeta(res.meta)

        setSelectedDocId((prevSelected) => {
          if (prevSelected) return prevSelected
          const first = (page === 1 ? res.data : []).at(0)
          return first ? first.id : null
        })
      } catch (error) {
        if (error instanceof AdminApiError) {
          toast.error(error.message)
        } else {
          toast.error("Erreur lors du chargement des documents")
        }
      } finally {
        setLoadingDocs(false)
        setLoadingMore(false)
      }
    },
    [candidatureId]
  )

  useEffect(() => {
    loadDossier()
    loadDocumentsPage(1)
  }, [loadDossier, loadDocumentsPage])

  const hasMore = !!docsMeta && docsMeta.page < docsMeta.last_page

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {loadingDossier
              ? "Chargement..."
              : dossier
                ? `${dossier.candidate?.email || ""} • Statut: ${dossier.status}`
                : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/dossiers">Retour</Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              loadDossier()
              loadDocumentsPage(1)
            }}
          >
            Rafraîchir
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <PdfList
          documents={docs}
          selectedId={selectedDocId}
          onSelect={setSelectedDocId}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={() => {
            if (!docsMeta) return
            loadDocumentsPage(docsMeta.page + 1)
          }}
          className="h-[70vh]"
        />

        <div className="h-[70vh]">
          {loadingDocs && docs.length === 0 ? (
            <Card className="flex h-full items-center justify-center">
              <CardHeader>
                <CardTitle className="text-base text-muted-foreground">Chargement des documents...</CardTitle>
              </CardHeader>
            </Card>
          ) : (
            <PdfViewer
              documentId={selectedDocId}
              fetchPdfBytes={fetchPdfBytes}
              className="h-full"
            />
          )}

          {!loadingDossier && dossier ? (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Informations candidat</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Nom:</span> {dossier.profile?.nom || "-"}
                </div>
                <div>
                  <span className="text-muted-foreground">Prénom:</span> {dossier.profile?.prenom || "-"}
                </div>
                <div>
                  <span className="text-muted-foreground">Spécialité:</span> {dossier.profile?.specialite || "-"}
                </div>
                <div>
                  <span className="text-muted-foreground">Établissement:</span> {dossier.profile?.etablissement || "-"}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
