"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { IconMinus, IconPlus } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist/types/src/display/api"

export type PdfViewerProps = {
  documentId: number | null
  fetchPdfBytes: (documentId: number, signal: AbortSignal) => Promise<ArrayBuffer>
  className?: string
}

const SCALE_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

export function PdfViewer({ documentId, fetchPdfBytes, className }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const renderTaskRef = useRef<RenderTask | null>(null)
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null)
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [scaleIndex, setScaleIndex] = useState(2) // 1.0
  const [renderTick, setRenderTick] = useState(0)
  const scale = SCALE_LEVELS[Math.min(Math.max(scaleIndex, 0), SCALE_LEVELS.length - 1)]

  const canPrev = page > 1
  const canNext = numPages > 0 && page < numPages

  const title = useMemo(() => {
    if (!documentId) return "Aucun document sélectionné"
    if (loading) return "Chargement du PDF..."
    if (error) return "Erreur"
    return `PDF #${documentId}`
  }, [documentId, loading, error])

  useEffect(() => {
    let alive = true
    const abort = new AbortController()

    async function load() {
      if (!documentId) {
        setError(null)
        setLoading(false)
        setNumPages(0)
        setPage(1)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Cleanup previous
        try {
          renderTaskRef.current?.cancel()
        } catch {
          // ignore
        }

        try {
          await loadingTaskRef.current?.destroy?.()
        } catch {
          // ignore
        }

        try {
          await pdfDocRef.current?.destroy?.()
        } catch {
          // ignore
        }

        renderTaskRef.current = null
        loadingTaskRef.current = null
        pdfDocRef.current = null

        const bytes = await fetchPdfBytes(documentId, abort.signal)

        type PdfJsModule = {
          getDocument: (params: { data: ArrayBuffer }) => PDFDocumentLoadingTask
          GlobalWorkerOptions: { workerSrc: string }
        }

        const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfJsModule

        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/legacy/build/pdf.worker.mjs",
          import.meta.url
        ).toString()

        const task = pdfjs.getDocument({ data: bytes })
        loadingTaskRef.current = task

        const pdf = await task.promise
        if (!alive) return

        pdfDocRef.current = pdf
        setNumPages(pdf.numPages)
        setPage(1)
        setRenderTick((t) => t + 1)
      } catch (e: unknown) {
        if (!alive) return
        if (abort.signal.aborted) return
        setError(e instanceof Error ? e.message : "Impossible de charger le PDF")
        setNumPages(0)
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
      abort.abort()
      try {
        renderTaskRef.current?.cancel()
      } catch {
        // ignore
      }
    }
  }, [documentId, fetchPdfBytes])

  useEffect(() => {
    let alive = true

    async function render() {
      const canvas = canvasRef.current
      const pdf = pdfDocRef.current

      if (!canvas || !pdf) {
        return
      }

      setError(null)

      try {
        try {
          renderTaskRef.current?.cancel()
        } catch {
          // ignore
        }

        renderTaskRef.current = null

        const pageNumber = Math.min(Math.max(page, 1), pdf.numPages)

        const pdfPage = await pdf.getPage(pageNumber)
        if (!alive) return

        const viewport = pdfPage.getViewport({ scale })
        const context = canvas.getContext("2d")
        if (!context) return

        const outputScale = window.devicePixelRatio || 1
        canvas.width = Math.floor(viewport.width * outputScale)
        canvas.height = Math.floor(viewport.height * outputScale)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`

        context.setTransform(outputScale, 0, 0, outputScale, 0, 0)
        context.clearRect(0, 0, viewport.width, viewport.height)

        const task = pdfPage.render({ canvas, canvasContext: context, viewport })
        renderTaskRef.current = task

        await task.promise
      } catch (e: unknown) {
        if (!alive) return
        // pdf.js uses RenderingCancelledException; avoid noisy errors.
        const msg = e && typeof e === "object" && "name" in e ? String((e as { name?: unknown }).name || "") : ""
        if (msg.toLowerCase().includes("cancel")) return
        setError(e instanceof Error ? e.message : "Erreur de rendu PDF")
      }
    }

    if (pdfDocRef.current) {
      render()
    }

    return () => {
      alive = false
      try {
        renderTaskRef.current?.cancel()
      } catch {
        // ignore
      }
    }
  }, [page, scale, renderTick])

  return (
    <div className={cn("flex h-full flex-col rounded-lg border bg-card", className)}>
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={scaleIndex <= 0}
            onClick={() => setScaleIndex((i) => Math.max(0, i - 1))}
          >
            <IconMinus className="size-4" />
          </Button>
          <div className="w-16 text-center text-sm text-muted-foreground">
            {Math.round(scale * 100)}%
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={scaleIndex >= SCALE_LEVELS.length - 1}
            onClick={() => setScaleIndex((i) => Math.min(SCALE_LEVELS.length - 1, i + 1))}
          >
            <IconPlus className="size-4" />
          </Button>

          <div className="mx-2 h-6 w-px bg-border" />

          <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Préc.
          </Button>

          <div className="flex items-center gap-2">
            <Input
              className="h-8 w-16"
              inputMode="numeric"
              value={String(page)}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "")
                const next = raw ? Number(raw) : 1
                setPage(next)
              }}
              onBlur={() => {
                if (numPages > 0) {
                  setPage((p) => Math.min(Math.max(p, 1), numPages))
                } else {
                  setPage(1)
                }
              }}
            />
            <div className="text-sm text-muted-foreground">/ {numPages || "-"}</div>
          </div>

          <Button variant="outline" size="sm" disabled={!canNext} onClick={() => setPage((p) => Math.min(numPages, p + 1))}>
            Suiv.
          </Button>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto p-4">
        {!documentId ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sélectionnez un PDF à gauche.
          </div>
        ) : loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Chargement...
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className="mx-auto w-fit rounded-md border bg-background p-2">
            <canvas ref={canvasRef} />
          </div>
        )}
      </div>
    </div>
  )
}
