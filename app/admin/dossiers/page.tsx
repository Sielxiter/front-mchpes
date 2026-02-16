"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { IconFolder, IconLoader2 } from "@tabler/icons-react"

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  AdminApiError,
  dossiersAdminApi,
  type AdminDossier,
  type CandidatureStatus,
} from "@/lib/api"

const STATUSES: Array<{ label: string; value: CandidatureStatus | "all" }> = [
  { label: "Tous", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Submitted", value: "submitted" },
  { label: "Blocked", value: "blocked" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
]

export default function Page() {
  const [fetching, setFetching] = useState(true)
  const [items, setItems] = useState<AdminDossier[]>([])
  const [page, setPage] = useState(1)
  const perPage = 12
  const [lastPage, setLastPage] = useState(1)

  const [specialite, setSpecialite] = useState("")
  const [etablissement, setEtablissement] = useState("")
  const [status, setStatus] = useState<CandidatureStatus | "all">("all")

  const fetchItems = useCallback(async () => {
    setFetching(true)
    try {
      const res = await dossiersAdminApi.getAll({
        specialite: specialite.trim() || undefined,
        etablissement: etablissement.trim() || undefined,
        status: status === "all" ? undefined : status,
        page,
        per_page: perPage,
      })
      setItems(res.data)
      setLastPage(res.meta.last_page)
    } catch (error) {
      if (error instanceof AdminApiError) {
        toast.error(error.message)
      } else {
        toast.error("Erreur lors du chargement des dossiers")
      }
    } finally {
      setFetching(false)
    }
  }, [specialite, etablissement, status, page, perPage])

  useEffect(() => {
    setPage(1)
  }, [specialite, etablissement, status])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const filtered = useMemo(() => {
    // Backend already filters; keep a stable list.
    return items
  }, [items])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Dossier</h1>
        <p className="text-muted-foreground mt-1">
          Liste des candidatures (vue carte).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="spec">Spécialité</Label>
          <Input
            id="spec"
            value={specialite}
            onChange={(e) => setSpecialite(e.target.value)}
            placeholder="ex: Informatique"
          />
        </div>
        <div>
          <Label htmlFor="eta">Établissement</Label>
          <Input
            id="eta"
            value={etablissement}
            onChange={(e) => setEtablissement(e.target.value)}
            placeholder="ex: UCA"
          />
        </div>
        <div>
          <Label htmlFor="status">Statut</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as CandidatureStatus | "all")}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={fetchItems} disabled={fetching}>
          Rafraîchir
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            disabled={fetching || page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Préc.
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} / {lastPage}
          </div>
          <Button
            variant="outline"
            disabled={fetching || page >= lastPage}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
          >
            Suiv.
          </Button>
        </div>
      </div>

      {fetching ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <IconLoader2 className="mr-2 size-5 animate-spin" /> Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Aucun dossier
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <IconFolder className="size-5" />
                  Dossier #{c.id}
                </CardTitle>
                <CardAction>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/dossiers/${c.id}`}>Ouvrir</Link>
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
