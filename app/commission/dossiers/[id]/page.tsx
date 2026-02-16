"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  IconArrowLeft,
  IconRefresh,
  IconUser,
  IconFileText,
  IconClipboardCheck,
  IconPlus,
  IconTrash,
  IconDeviceFloppy,
  IconStarFilled,
  IconStar,
  IconChartBar,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PdfList } from "@/components/dossier/pdf-list"
import { PdfViewer } from "@/components/dossier/pdf-viewer"

import {
  CommissionApiError,
  commissionApi,
  type CommissionDossier,
  type CommissionDossierDocument,
} from "@/lib/api"

type Meta = { page: number; per_page: number; total: number; last_page: number }

type EditableNote = { criterion: string; score: string; comment: string }

const CRITERIA_TEMPLATES = [
  "Dossier scientifique",
  "Expérience pédagogique",
  "Publications et communications",
  "Encadrement (PFE / Thèses)",
  "Activités de recherche",
  "Rayonnement et responsabilités",
]

function scoreColor(s: number) {
  if (s >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (s >= 60) return "text-blue-600 dark:text-blue-400"
  if (s >= 40) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}
function scoreBarColor(s: number) {
  if (s >= 80) return "bg-emerald-500"
  if (s >= 60) return "bg-blue-500"
  if (s >= 40) return "bg-amber-500"
  return "bg-red-500"
}
function StarRating({ score }: { score: number }) {
  const stars = Math.round(score / 20)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= stars
          ? <IconStarFilled key={i} className="size-4 text-amber-500" />
          : <IconStar key={i} className="size-4 text-muted-foreground/30" />
      )}
    </div>
  )
}

export default function Page() {
  const params = useParams<{ id?: string | string[] }>()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const candidatureId = Number(id)

  /* ── state ── */
  const [loadingDossier, setLoadingDossier] = useState(true)
  const [dossier, setDossier] = useState<CommissionDossier | null>(null)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [docs, setDocs] = useState<CommissionDossierDocument[]>([])
  const [docsMeta, setDocsMeta] = useState<Meta | null>(null)
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null)
  const [notesLoading, setNotesLoading] = useState(true)
  const [notesSaving, setNotesSaving] = useState(false)
  const [notes, setNotes] = useState<EditableNote[]>([{ criterion: "", score: "", comment: "" }])
  const [evalOpen, setEvalOpen] = useState(false)
  const bytesCacheRef = useRef(new Map<number, ArrayBuffer>())

  const candidateName = useMemo(() => {
    if (!dossier) return ""
    const p = dossier.profile
    if (p?.nom && p?.prenom) return `${p.prenom} ${p.nom}`
    return dossier.candidate?.name || `Candidat #${dossier.id}`
  }, [dossier])

  /* ── loaders ── */
  const fetchPdfBytes = useCallback(async (docId: number, signal: AbortSignal) => {
    const cached = bytesCacheRef.current.get(docId)
    if (cached) return cached
    const bytes = await commissionApi.downloadDocumentBytes(docId, signal)
    bytesCacheRef.current.set(docId, bytes)
    return bytes
  }, [])

  const loadDossier = useCallback(async () => {
    if (!Number.isFinite(candidatureId)) return
    setLoadingDossier(true)
    try { setDossier((await commissionApi.getDossierById(candidatureId)).data) }
    catch (e) { toast.error(e instanceof CommissionApiError ? e.message : "Erreur chargement dossier"); setDossier(null) }
    finally { setLoadingDossier(false) }
  }, [candidatureId])

  const loadDocsPage = useCallback(async (pg: number) => {
    if (!Number.isFinite(candidatureId)) return
    if (pg === 1) setLoadingDocs(true); else setLoadingMore(true)
    try {
      const res = await commissionApi.getDocuments(candidatureId, { page: pg, per_page: 20 })
      setDocs(prev => pg === 1 ? res.data : [...prev, ...res.data])
      setDocsMeta(res.meta)
      setSelectedDocId(prev => prev ?? (pg === 1 ? res.data : []).at(0)?.id ?? null)
    } catch (e) { toast.error(e instanceof CommissionApiError ? e.message : "Erreur chargement documents") }
    finally { setLoadingDocs(false); setLoadingMore(false) }
  }, [candidatureId])

  const loadNotes = useCallback(async () => {
    if (!Number.isFinite(candidatureId)) return
    setNotesLoading(true)
    try {
      const items = (await commissionApi.getNotes(candidatureId)).data
      if (!items?.length) { setNotes([{ criterion: "", score: "", comment: "" }]); return }
      setNotes(items.map(n => ({
        criterion: n.criterion || "",
        score: n.score == null ? "" : String(n.score),
        comment: n.comment || "",
      })))
    } catch (e) { toast.error(e instanceof CommissionApiError ? e.message : "Erreur chargement notes") }
    finally { setNotesLoading(false) }
  }, [candidatureId])

  useEffect(() => { loadDossier(); loadDocsPage(1); loadNotes() }, [loadDossier, loadDocsPage, loadNotes])

  const hasMore = !!docsMeta && docsMeta.page < docsMeta.last_page

  /* ── eval stats ── */
  const evalStats = useMemo(() => {
    const scores = notes
      .filter(n => n.criterion.trim() && n.score.trim())
      .map(n => Number(n.score))
      .filter(Number.isFinite)
    const total = scores.reduce((a, b) => a + b, 0)
    return { total, avg: scores.length ? total / scores.length : 0, count: scores.length }
  }, [notes])

  /* ── save ── */
  const saveNotes = async () => {
    if (!Number.isFinite(candidatureId)) return
    const cleaned = notes
      .map(n => {
        const criterion = n.criterion.trim()
        const comment = n.comment.trim()
        const scoreStr = n.score.trim()
        let score: number | null = null
        if (scoreStr) { const p = Number(scoreStr); if (!Number.isFinite(p)) { toast.error("Score invalide"); return null }; score = p }
        return { criterion, comment: comment || null, score }
      })
      .filter((n): n is NonNullable<typeof n> => n !== null)
      .filter(n => n.criterion || n.comment || n.score !== null)

    if (!cleaned.length) { toast.error("Ajoutez au moins un critère"); return }
    if (cleaned.some(n => !n.criterion)) { toast.error("Le critère est obligatoire"); return }
    if (cleaned.some(n => n.score !== null && (n.score < 0 || n.score > 100))) { toast.error("Score doit être entre 0 et 100"); return }

    setNotesSaving(true)
    try {
      await commissionApi.saveNotes(candidatureId, cleaned)
      toast.success("Notes enregistrées")
      await loadNotes()
    } catch (e) {
      if (e instanceof CommissionApiError) { toast.error(e.errors ? Object.values(e.errors)[0]?.[0] ?? e.message : e.message) }
      else toast.error("Erreur enregistrement")
    } finally { setNotesSaving(false) }
  }

  const addTemplate = (t: string) => {
    if (notes.some(n => n.criterion.trim().toLowerCase() === t.toLowerCase())) { toast.info("Critère déjà ajouté"); return }
    setNotes(prev => {
      if (prev.length === 1 && !prev[0].criterion && !prev[0].score && !prev[0].comment) return [{ criterion: t, score: "", comment: "" }]
      return [...prev, { criterion: t, score: "", comment: "" }]
    })
  }

  const statusBadge = (s: string) => {
    if (s === "submitted") return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Soumis</Badge>
    if (s === "validated") return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Validé</Badge>
    if (s === "draft") return <Badge variant="secondary">Brouillon</Badge>
    return <Badge variant="outline">{s}</Badge>
  }

  /* ── render ── */
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon"><Link href="/commission"><IconArrowLeft className="size-5" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold">{loadingDossier ? "Chargement..." : candidateName}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {dossier && <><span>Dossier #{dossier.id}</span><span>&bull;</span>{statusBadge(dossier.status)}</>}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { loadDossier(); loadDocsPage(1); loadNotes() }}>
          <IconRefresh className="mr-2 size-4" /> Rafraîchir
        </Button>
      </div>

      {/* Candidate summary */}
      {!loadingDossier && dossier && (
        <Card>
          <CardContent className="py-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10"><IconUser className="size-5 text-primary" /></div>
                <div><p className="text-xs text-muted-foreground">Candidat</p><p className="font-medium">{candidateName}</p></div>
              </div>
              <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium">{dossier.candidate?.email || "-"}</p></div>
              <div><p className="text-xs text-muted-foreground">Spécialité</p><p className="text-sm font-medium">{dossier.profile?.specialite || "-"}</p></div>
              <div><p className="text-xs text-muted-foreground">Établissement</p><p className="text-sm font-medium">{dossier.profile?.etablissement || "-"}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents" className="gap-2">
            <IconFileText className="size-4" /> Documents
            {docs.length > 0 && <Badge variant="secondary" className="ml-1 px-1.5 text-xs">{docs.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="evaluation" className="gap-2">
            <IconClipboardCheck className="size-4" /> Évaluation
            {evalStats.count > 0 && <Badge variant="secondary" className="ml-1 px-1.5 text-xs">{evalStats.avg.toFixed(0)}/100</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Documents */}
        <TabsContent value="documents">
          <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
            <PdfList documents={docs} selectedId={selectedDocId} onSelect={setSelectedDocId} hasMore={hasMore} loadingMore={loadingMore} onLoadMore={() => docsMeta && loadDocsPage(docsMeta.page + 1)} className="h-[72vh]" />
            <div className="h-[72vh]">
              {loadingDocs && !docs.length ? (
                <Card className="flex h-full items-center justify-center"><CardHeader><CardTitle className="text-base text-muted-foreground">Chargement...</CardTitle></CardHeader></Card>
              ) : (
                <PdfViewer documentId={selectedDocId} fetchPdfBytes={fetchPdfBytes} className="h-full" />
              )}
            </div>
          </div>
        </TabsContent>

        {/* Evaluation */}
        <TabsContent value="evaluation" className="space-y-4">
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="flex items-center gap-4 py-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10"><IconChartBar className="size-6 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Moyenne</p><p className={`text-2xl font-bold ${evalStats.count ? scoreColor(evalStats.avg) : ""}`}>{evalStats.count ? evalStats.avg.toFixed(1) : "-"}<span className="text-sm font-normal text-muted-foreground">/100</span></p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 py-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10"><IconStarFilled className="size-6 text-amber-500" /></div>
              <div><p className="text-sm text-muted-foreground">Total des points</p><p className="text-2xl font-bold">{evalStats.count ? evalStats.total.toFixed(1) : "-"}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 py-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10"><IconClipboardCheck className="size-6 text-blue-500" /></div>
              <div><p className="text-sm text-muted-foreground">Critères évalués</p><p className="text-2xl font-bold">{evalStats.count}</p></div>
            </CardContent></Card>
          </div>

          {/* Eval grid + dialog */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Grille d&apos;évaluation</CardTitle>
              <Dialog open={evalOpen} onOpenChange={setEvalOpen}>
                <DialogTrigger asChild><Button size="sm"><IconClipboardCheck className="mr-2 size-4" /> Évaluer</Button></DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Évaluation &mdash; {candidateName}</DialogTitle>
                    <DialogDescription>Attribuez une note de 0 à 100 pour chaque critère.</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Critères pré-définis</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {CRITERIA_TEMPLATES.map(t => (
                        <Button key={t} type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => addTemplate(t)}>
                          <IconPlus className="mr-1 size-3" />{t}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Separator />

                  <div className="space-y-3">
                    {notesLoading ? <p className="py-4 text-center text-sm text-muted-foreground">Chargement...</p> : notes.map((n, idx) => (
                      <div key={idx} className="space-y-2 rounded-lg border p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-1.5">
                            <Label className="text-xs">Critère</Label>
                            <Input value={n.criterion} onChange={e => setNotes(p => p.map((x, i) => i === idx ? { ...x, criterion: e.target.value } : x))} placeholder="ex: Dossier scientifique" className="h-9" />
                          </div>
                          <div className="w-24 space-y-1.5">
                            <Label className="text-xs">Score /100</Label>
                            <Input value={n.score} onChange={e => setNotes(p => p.map((x, i) => i === idx ? { ...x, score: e.target.value } : x))} inputMode="decimal" placeholder="85" className="h-9" />
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="mt-6 size-9 text-destructive hover:text-destructive" disabled={notes.length <= 1} onClick={() => setNotes(p => p.filter((_, i) => i !== idx))}><IconTrash className="size-4" /></Button>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Commentaire</Label>
                          <textarea className="flex min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={n.comment} onChange={e => setNotes(p => p.map((x, i) => i === idx ? { ...x, comment: e.target.value } : x))} placeholder="Commentaire optionnel..." />
                        </div>
                        {n.score.trim() && Number.isFinite(Number(n.score)) && (
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all ${scoreBarColor(Number(n.score))}`} style={{ width: `${Math.min(100, Math.max(0, Number(n.score)))}%` }} /></div>
                            <span className={`text-xs font-semibold ${scoreColor(Number(n.score))}`}>{Number(n.score).toFixed(0)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {evalStats.count > 0 && (<><Separator /><div className="flex items-center justify-between rounded-lg bg-muted/50 p-3"><div><p className="text-sm font-medium">Résumé</p><p className="text-xs text-muted-foreground">{evalStats.count} critère(s)</p></div><div className="text-right"><p className={`text-2xl font-bold ${scoreColor(evalStats.avg)}`}>{evalStats.avg.toFixed(1)}</p><p className="text-xs text-muted-foreground">Moyenne /100</p></div></div></>)}

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => setNotes(p => [...p, { criterion: "", score: "", comment: "" }])}><IconPlus className="mr-2 size-4" />Ajouter</Button>
                    <Button onClick={saveNotes} disabled={notesSaving}><IconDeviceFloppy className="mr-2 size-4" />{notesSaving ? "Enregistrement..." : "Enregistrer"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {notesLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Chargement...</p>
                : evalStats.count === 0 && notes.every(n => !n.criterion.trim()) ? (
                  <div className="py-8 text-center">
                    <IconClipboardCheck className="mx-auto mb-3 size-12 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Aucune évaluation</p>
                    <p className="mt-1 text-xs text-muted-foreground">Cliquez sur &laquo;&nbsp;Évaluer&nbsp;&raquo; pour commencer</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.filter(n => n.criterion.trim()).map((n, idx) => {
                      const s = Number(n.score); const has = n.score.trim() !== "" && Number.isFinite(s)
                      return (
                        <div key={idx} className="flex items-center gap-4 rounded-lg border p-3">
                          <div className="min-w-0 flex-1"><p className="font-medium">{n.criterion}</p>{n.comment && <p className="mt-0.5 text-xs text-muted-foreground">{n.comment}</p>}</div>
                          {has && <div className="flex items-center gap-3"><StarRating score={s} /><div className="w-24"><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all ${scoreBarColor(s)}`} style={{ width: `${Math.min(100, Math.max(0, s))}%` }} /></div></div><span className={`w-12 text-right text-sm font-bold ${scoreColor(s)}`}>{s.toFixed(0)}</span></div>}
                        </div>
                      )
                    })}
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
