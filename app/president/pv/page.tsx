"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  IconLoader2,
  IconGavel,
  IconShieldCheck,
  IconChartBar,
  IconStarFilled,
  IconStar,
  IconExternalLink,
  IconCheck,
  IconRefresh,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import {
  PresidentApiError,
  presidentApi,
  type PresidentDossier,
  type PresidentResult,
} from "@/lib/api"

type Meta = { page: number; per_page: number; total: number; last_page: number }

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
          ? <IconStarFilled key={i} className="size-3.5 text-amber-500" />
          : <IconStar key={i} className="size-3.5 text-muted-foreground/30" />
      )}
    </div>
  )
}

type DossierWithResult = PresidentDossier & { result?: PresidentResult | null; resultLoading?: boolean }

export default function PVPage() {
  const [fetching, setFetching] = useState(true)
  const [items, setItems] = useState<DossierWithResult[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [page, setPage] = useState(1)
  const perPage = 20

  /* quick-edit dialog */
  const [editItem, setEditItem] = useState<DossierWithResult | null>(null)
  const [editAudition, setEditAudition] = useState("")
  const [editFinal, setEditFinal] = useState("")
  const [editPv, setEditPv] = useState("")
  const [editSaving, setEditSaving] = useState(false)
  const [editResult, setEditResult] = useState<PresidentResult | null>(null)
  const [editResultLoading, setEditResultLoading] = useState(false)

  const fetchItems = useCallback(async () => {
    setFetching(true)
    try {
      const res = await presidentApi.getDossiers({ page, per_page: perPage })
      setItems(res.data.map(d => ({ ...d, result: undefined, resultLoading: true })))
      setMeta(res.meta)

      // load results for each dossier in background
      for (const d of res.data) {
        presidentApi.getResult(d.id).then(r => {
          setItems(prev => prev.map(x => x.id === d.id ? { ...x, result: r.data, resultLoading: false } : x))
        }).catch(() => {
          setItems(prev => prev.map(x => x.id === d.id ? { ...x, result: null, resultLoading: false } : x))
        })
      }
    } catch (e) {
      toast.error(e instanceof PresidentApiError ? e.message : "Erreur chargement")
    } finally { setFetching(false) }
  }, [page])

  useEffect(() => { fetchItems() }, [fetchItems])

  const lastPage = meta?.last_page ?? 1
  const total = meta?.total ?? 0

  /* stats */
  const stats = useMemo(() => {
    const loaded = items.filter(i => !i.resultLoading)
    const validated = loaded.filter(i => i.result?.validated_at)
    const withScore = loaded.filter(i => i.result?.final_score != null)
    const avgScore = withScore.length
      ? withScore.reduce((sum, i) => sum + (i.result?.final_score ?? 0), 0) / withScore.length
      : 0
    return { total: loaded.length, validated: validated.length, withScore: withScore.length, avgScore }
  }, [items])

  /* open edit dialog */
  const openEdit = async (d: DossierWithResult) => {
    setEditItem(d)
    setEditResultLoading(true)
    try {
      const r = (await presidentApi.getResult(d.id)).data
      setEditResult(r)
      setEditAudition(r.audition_score == null ? "" : String(r.audition_score))
      setEditFinal(r.final_score == null ? "" : String(r.final_score))
      setEditPv(r.pv_text || "")
    } catch {
      setEditResult(null)
      setEditAudition(""); setEditFinal(""); setEditPv("")
    } finally { setEditResultLoading(false) }
  }

  const saveEdit = async () => {
    if (!editItem) return
    const aVal = editAudition.trim() ? Number(editAudition) : null
    const fVal = editFinal.trim() ? Number(editFinal) : null
    if (aVal !== null && (!Number.isFinite(aVal) || aVal < 0 || aVal > 100)) { toast.error("Note audition: 0-100"); return }
    if (fVal !== null && (!Number.isFinite(fVal) || fVal < 0 || fVal > 100)) { toast.error("Note finale: 0-100"); return }

    setEditSaving(true)
    try {
      await presidentApi.saveResult(editItem.id, { audition_score: aVal, final_score: fVal, pv_text: editPv || null })
      toast.success("PV enregistré")
      // refresh this item
      const r = (await presidentApi.getResult(editItem.id)).data
      setEditResult(r)
      setItems(prev => prev.map(x => x.id === editItem.id ? { ...x, result: r, resultLoading: false } : x))
    } catch (e) { toast.error(e instanceof PresidentApiError ? e.message : "Erreur enregistrement") }
    finally { setEditSaving(false) }
  }

  const validateEdit = async () => {
    if (!editItem) return
    try {
      const res = await presidentApi.validateFinal(editItem.id)
      toast.success(res.message)
      const r = (await presidentApi.getResult(editItem.id)).data
      setEditResult(r)
      setItems(prev => prev.map(x => x.id === editItem.id ? { ...x, result: r, resultLoading: false } : x))
    } catch (e) { toast.error(e instanceof PresidentApiError ? e.message : "Erreur validation") }
  }

  const editValidated = Boolean(editResult?.validated_at)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">PV &amp; Validation</h1>
          <p className="mt-1 text-muted-foreground">Vue d&apos;ensemble des résultats et procès-verbaux</p>
        </div>
        <Button onClick={fetchItems} disabled={fetching} variant="outline">
          <IconRefresh className="mr-2 size-4" /> Rafraîchir
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="flex items-center gap-4 py-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10"><IconGavel className="size-6 text-primary" /></div>
          <div><p className="text-sm text-muted-foreground">Total dossiers</p><p className="text-2xl font-bold">{total}</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 py-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10"><IconShieldCheck className="size-6 text-emerald-500" /></div>
          <div><p className="text-sm text-muted-foreground">Validés</p><p className="text-2xl font-bold text-emerald-600">{stats.validated}<span className="text-sm font-normal text-muted-foreground">/{stats.total}</span></p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 py-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10"><IconChartBar className="size-6 text-blue-500" /></div>
          <div><p className="text-sm text-muted-foreground">Avec note finale</p><p className="text-2xl font-bold">{stats.withScore}</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 py-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10"><IconStarFilled className="size-6 text-amber-500" /></div>
          <div><p className="text-sm text-muted-foreground">Moyenne générale</p><p className={`text-2xl font-bold ${stats.withScore ? scoreColor(stats.avgScore) : ""}`}>{stats.withScore ? stats.avgScore.toFixed(1) : "-"}<span className="text-sm font-normal text-muted-foreground">/100</span></p></div>
        </CardContent></Card>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{total} dossier(s)</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || fetching} onClick={() => setPage(p => Math.max(1, p - 1))}>Préc.</Button>
          <span className="text-sm text-muted-foreground">Page {page} / {lastPage}</span>
          <Button variant="outline" size="sm" disabled={page >= lastPage || fetching} onClick={() => setPage(p => Math.min(lastPage, p + 1))}>Suiv.</Button>
        </div>
      </div>

      {/* Table */}
      {fetching ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <IconLoader2 className="mr-2 size-5 animate-spin" /> Chargement...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">Aucun dossier</div>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Candidat</th>
                  <th className="px-4 py-3 text-left font-medium">Spécialité</th>
                  <th className="px-4 py-3 text-center font-medium">Audition</th>
                  <th className="px-4 py-3 text-center font-medium">Note finale</th>
                  <th className="px-4 py-3 text-center font-medium">PV</th>
                  <th className="px-4 py-3 text-center font-medium">Statut</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(d => {
                  const name = d.profile?.nom && d.profile?.prenom ? `${d.profile.prenom} ${d.profile.nom}` : d.candidate?.name || `#${d.id}`
                  const r = d.result
                  const isValidated = Boolean(r?.validated_at)
                  return (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">{d.candidate?.email || "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{d.profile?.specialite || "-"}</td>
                      <td className="px-4 py-3 text-center">
                        {d.resultLoading ? <span className="text-xs text-muted-foreground">...</span>
                          : r?.audition_score != null ? <span className={`font-semibold ${scoreColor(r.audition_score)}`}>{r.audition_score.toFixed(1)}</span>
                          : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {d.resultLoading ? <span className="text-xs text-muted-foreground">...</span>
                          : r?.final_score != null ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className={`font-semibold ${scoreColor(r.final_score)}`}>{r.final_score.toFixed(1)}</span>
                              <StarRating score={r.final_score} />
                            </div>
                          ) : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {d.resultLoading ? <span className="text-xs text-muted-foreground">...</span>
                          : r?.pv_text ? <Badge variant="secondary" className="text-xs">Rédigé</Badge>
                          : <span className="text-xs text-muted-foreground">Non</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {d.resultLoading ? <span className="text-xs text-muted-foreground">...</span>
                          : isValidated ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Validé</Badge>
                          : <Badge variant="outline">En attente</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
                            <IconGavel className="mr-1 size-4" /> PV
                          </Button>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/president/dossiers/${d.id}`}><IconExternalLink className="mr-1 size-4" /> Dossier</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Edit PV Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null) }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              PV &mdash; {editItem?.profile?.prenom} {editItem?.profile?.nom || editItem?.candidate?.name || `Dossier #${editItem?.id}`}
            </DialogTitle>
            <DialogDescription>
              {editValidated ? "Ce PV est validé et ne peut plus être modifié." : "Saisissez les notes et rédigez le PV."}
            </DialogDescription>
          </DialogHeader>

          {editResultLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground"><IconLoader2 className="mr-2 size-5 animate-spin" /> Chargement...</div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Note audition /100</Label>
                  <Input value={editAudition} onChange={e => setEditAudition(e.target.value)} inputMode="decimal" placeholder="75" disabled={editValidated} />
                  {editAudition.trim() && Number.isFinite(Number(editAudition)) && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all ${scoreBarColor(Number(editAudition))}`} style={{ width: `${Math.min(100, Math.max(0, Number(editAudition)))}%` }} /></div>
                      <span className={`text-xs font-semibold ${scoreColor(Number(editAudition))}`}>{Number(editAudition).toFixed(0)}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Note finale /100</Label>
                  <Input value={editFinal} onChange={e => setEditFinal(e.target.value)} inputMode="decimal" placeholder="82" disabled={editValidated} />
                  {editFinal.trim() && Number.isFinite(Number(editFinal)) && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all ${scoreBarColor(Number(editFinal))}`} style={{ width: `${Math.min(100, Math.max(0, Number(editFinal)))}%` }} /></div>
                      <span className={`text-xs font-semibold ${scoreColor(Number(editFinal))}`}>{Number(editFinal).toFixed(0)}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Texte du PV</Label>
                <textarea
                  className="flex min-h-48 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editPv}
                  onChange={e => setEditPv(e.target.value)}
                  placeholder="Rédiger le procès-verbal..."
                  disabled={editValidated}
                />
                <p className="text-xs text-muted-foreground">{editPv.length} caractères</p>
              </div>

              {editValidated && editResult?.validated_at && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                  <IconShieldCheck className="size-5" />
                  Validé le {new Date(editResult.validated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button onClick={saveEdit} disabled={editSaving || editValidated}>
              {editSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button variant="destructive" onClick={validateEdit} disabled={editValidated}>
              <IconCheck className="mr-2 size-4" /> Valider (irréversible)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
