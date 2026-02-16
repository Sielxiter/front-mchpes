"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { IconFolder, IconLoader2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  CommissionApiError,
  commissionApi,
  type CommissionDossier,
  type CommissionCommissionMeta,
} from "@/lib/api"

type Meta = { page: number; per_page: number; total: number; last_page: number } & CommissionCommissionMeta

export default function Page() {
  const [fetching, setFetching] = useState(true)
  const [items, setItems] = useState<CommissionDossier[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [page, setPage] = useState(1)
  const perPage = 12

  const fetchItems = useCallback(async () => {
    setFetching(true)
    try {
      const res = await commissionApi.getDossiers({ page, per_page: perPage })
      setItems(res.data)
      setMeta(res.meta)
    } catch (error) {
      if (error instanceof CommissionApiError) {
        toast.error(error.message)
      } else {
        toast.error("Erreur lors du chargement des dossiers")
      }
    } finally {
      setFetching(false)
    }
  }, [page])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const title = useMemo(() => {
    const spec = meta?.commission?.specialite
    return spec ? `Commission — ${spec}` : "Commission"
  }, [meta])

  const lastPage = meta?.last_page ?? 1
  const total = meta?.total ?? 0
  const hasCommission = Boolean(meta?.commission)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-muted-foreground">
            Liste des candidats de votre spécialité.
          </p>
        </div>
        <Button onClick={fetchItems} disabled={fetching} variant="outline">
          Rafraîchir
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Total: {total}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={page <= 1 || fetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Préc.
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} / {lastPage}
          </div>
          <Button variant="outline" disabled={page >= lastPage || fetching} onClick={() => setPage((p) => Math.min(lastPage, p + 1))}>
            Suiv.
          </Button>
        </div>
      </div>

      {fetching ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <IconLoader2 className="mr-2 size-5 animate-spin" /> Chargement...
        </div>
      ) : !hasCommission ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Aucune commission affectée à votre compte.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Aucun dossier
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Card key={c.id}>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <IconFolder className="size-5" />
                  Dossier #{c.id}
                </CardTitle>
                <CardAction>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/commission/dossiers/${c.id}`}>Ouvrir</Link>
                  </Button>
                </CardAction>
                <div className="text-sm text-muted-foreground">
                  {c.candidate?.name || "(sans nom)"} — {c.candidate?.email || "(sans email)"}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Statut:</span> {c.status}
                </div>
                <div>
                  <span className="text-muted-foreground">Spécialité:</span> {c.profile?.specialite || "-"}
                </div>
                <div>
                  <span className="text-muted-foreground">Établissement:</span> {c.profile?.etablissement || "-"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
