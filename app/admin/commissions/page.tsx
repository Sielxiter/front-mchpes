"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { IconLoader2, IconUsers } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

import {
  AdminApiError,
  commissionsAdminApi,
  commissionUsersAdminApi,
  usersAdminApi,
  type AdminCommission,
  type AdminCommissionUserRow,
  type AdminUser,
  type UserRole,
} from "@/lib/api"

export default function Page() {
  const [fetching, setFetching] = useState(true)
  const [items, setItems] = useState<AdminCommission[]>([])

  const [specialite, setSpecialite] = useState("")
  const [creating, setCreating] = useState(false)

  const [membersOpen, setMembersOpen] = useState(false)
  const [membersLoading, setMembersLoading] = useState(false)
  const [selectedCommission, setSelectedCommission] = useState<AdminCommission | null>(null)
  const [assigned, setAssigned] = useState<AdminCommissionUserRow[]>([])

  const [eligibleLoading, setEligibleLoading] = useState(false)
  const [eligible, setEligible] = useState<AdminUser[]>([])

  const [pickedUserId, setPickedUserId] = useState<string>("")
  const [pickedIsPresident, setPickedIsPresident] = useState(false)
  const [assigning, setAssigning] = useState(false)

  const fetchItems = useCallback(async () => {
    setFetching(true)
    try {
      const res = await commissionsAdminApi.getAll()
      setItems(res.data)
    } catch (error) {
      if (error instanceof AdminApiError) {
        toast.error(error.message)
      } else {
        toast.error("Erreur lors du chargement des commissions")
      }
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const create = async () => {
    const value = specialite.trim()
    if (!value) {
      toast.error("La spécialité est requise")
      return
    }

    setCreating(true)
    try {
      await commissionsAdminApi.create(value)
      toast.success("Commission créée")
      setSpecialite("")
      await fetchItems()
    } catch (error) {
      if (error instanceof AdminApiError) {
        const msg = error.errors ? Object.values(error.errors)[0]?.[0] : null
        toast.error(msg || error.message)
      } else {
        toast.error("Erreur lors de la création")
      }
    } finally {
      setCreating(false)
    }
  }

  const openMembers = async (commission: AdminCommission) => {
    setSelectedCommission(commission)
    setMembersOpen(true)
    setPickedUserId("")
    setPickedIsPresident(false)

    setMembersLoading(true)
    setEligibleLoading(true)

    try {
      const [assignedRes, cRes, pRes] = await Promise.all([
        commissionsAdminApi.getUsers(commission.id),
        usersAdminApi.getAll({ role: "Commission", page: 1, per_page: 100 }),
        usersAdminApi.getAll({ role: "Président", page: 1, per_page: 100 }),
      ])

      setAssigned(assignedRes.data)

      const map = new Map<number, AdminUser>()
      for (const u of [...cRes.data, ...pRes.data]) {
        map.set(u.id, u)
      }
      setEligible(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      if (error instanceof AdminApiError) {
        toast.error(error.message)
      } else {
        toast.error("Erreur lors du chargement des membres")
      }
    } finally {
      setMembersLoading(false)
      setEligibleLoading(false)
    }
  }

  const refreshAssigned = useCallback(async (commissionId: number) => {
    const res = await commissionsAdminApi.getUsers(commissionId)
    setAssigned(res.data)
  }, [])

  const assignPicked = async () => {
    if (!selectedCommission) return
    const userId = Number(pickedUserId)
    if (!Number.isFinite(userId) || userId <= 0) {
      toast.error("Choisissez un utilisateur")
      return
    }

    const pickedUser = eligible.find((u) => u.id === userId)
    const role: UserRole | null = (pickedUser?.role as UserRole) || null
    const isPresident = role === "Président" ? true : Boolean(pickedIsPresident)

    setAssigning(true)
    try {
      await commissionUsersAdminApi.assignForUser(userId, {
        specialite: selectedCommission.specialite,
        is_president: isPresident,
      })
      toast.success("Membre ajouté")
      setPickedUserId("")
      setPickedIsPresident(false)
      await refreshAssigned(selectedCommission.id)
    } catch (error) {
      if (error instanceof AdminApiError) {
        const msg = error.errors ? Object.values(error.errors)[0]?.[0] : null
        toast.error(msg || error.message)
      } else {
        toast.error("Erreur lors de l'ajout")
      }
    } finally {
      setAssigning(false)
    }
  }

  const removeMember = async (userId: number) => {
    if (!selectedCommission) return
    setAssigning(true)
    try {
      await commissionUsersAdminApi.removeForUser(userId, { specialite: selectedCommission.specialite })
      toast.success("Membre retiré")
      await refreshAssigned(selectedCommission.id)
    } catch (error) {
      if (error instanceof AdminApiError) {
        toast.error(error.message)
      } else {
        toast.error("Erreur lors de la suppression")
      }
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Commissions</h1>
        <p className="mt-1 text-muted-foreground">
          Créer une commission (groupe) par spécialité.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Créer une commission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="spec">Spécialité</Label>
            <Input
              id="spec"
              value={specialite}
              onChange={(e) => setSpecialite(e.target.value)}
              placeholder="ex: Informatique"
              disabled={creating}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={create} disabled={creating}>
              {creating ? "Création..." : "Créer"}
            </Button>
            <Button variant="outline" onClick={fetchItems} disabled={fetching}>
              Rafraîchir
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liste</CardTitle>
        </CardHeader>
        <CardContent>
          {fetching ? (
            <div className="text-sm text-muted-foreground">Chargement...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">Aucune commission</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <Card key={c.id}>
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-base">{c.specialite}</CardTitle>
                    <div className="text-sm text-muted-foreground">Commission #{c.id}</div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="text-muted-foreground">
                      Membres (ancien module): {c.members_count}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openMembers(c)}
                      className="w-full"
                    >
                      <IconUsers className="mr-2 size-4" /> Gérer les membres
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Membres de la commission</DialogTitle>
            <DialogDescription>
              Commission: {selectedCommission?.specialite || ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border p-3">
              <div className="text-sm font-medium mb-2">Membres affectés (utilisateurs)</div>
              {membersLoading ? (
                <div className="flex items-center text-sm text-muted-foreground">
                  <IconLoader2 className="mr-2 size-4 animate-spin" /> Chargement...
                </div>
              ) : assigned.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucun membre</div>
              ) : (
                <div className="space-y-2">
                  {assigned.map((row) => (
                    <div key={row.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {row.user?.name || "(sans nom)"}{row.is_president ? " — Président" : ""}
                        </div>
                        <div className="truncate text-muted-foreground">
                          {row.user?.email || ""} • {row.user?.role || ""}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={assigning || !row.user?.id}
                        onClick={() => removeMember(Number(row.user?.id))}
                      >
                        Retirer
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-md border p-3 space-y-3">
              <div className="text-sm font-medium">Ajouter un membre</div>

              <div className="space-y-2">
                <Label>Utilisateur</Label>
                <Select
                  value={pickedUserId}
                  onValueChange={(v) => {
                    setPickedUserId(v)
                    const u = eligible.find((x) => String(x.id) === v)
                    setPickedIsPresident(u?.role === "Président")
                  }}
                  disabled={eligibleLoading || assigning}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={eligibleLoading ? "Chargement..." : "Choisir un utilisateur"} />
                  </SelectTrigger>
                  <SelectContent>
                    {eligible.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name} — {u.email} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={pickedIsPresident}
                  onCheckedChange={(v) => setPickedIsPresident(Boolean(v))}
                  disabled={assigning || (eligible.find((x) => String(x.id) === pickedUserId)?.role === "Président")}
                />
                <div className="text-sm">Président</div>
              </div>

              <Button onClick={assignPicked} disabled={assigning}>
                {assigning ? "Enregistrement..." : "Ajouter"}
              </Button>

              <div className="text-xs text-muted-foreground">
                Limite: 4 membres + 1 président (contrôlé côté serveur).
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fermer</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
