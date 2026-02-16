"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { IconAlertCircle, IconLoader2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

import { me } from "@/lib/auth"
import {
  AdminApiError,
  type AdminUser,
  type AdminSpecialite,
  type CommissionAssignment,
  type CreateCandidateUserInput,
  type UserRole,
  commissionUsersAdminApi,
  specialitesAdminApi,
  usersAdminApi,
} from "@/lib/api"

const ROLES: UserRole[] = ["Admin", "Candidat", "Commission", "Président", "Système"]

export default function Page() {
  const [fetching, setFetching] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [q, setQ] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all")

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<10 | 20 | 50 | 100>(10)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState<UserRole>("Candidat")

  const [specialitesLoading, setSpecialitesLoading] = useState(false)
  const [specialites, setSpecialites] = useState<AdminSpecialite[]>([])
  const [commissionAssignmentsLoading, setCommissionAssignmentsLoading] = useState(false)
  const [commissionAssignments, setCommissionAssignments] = useState<CommissionAssignment[]>([])
  const [commissionSpecialite, setCommissionSpecialite] = useState<string>("")
  const [commissionEnabled, setCommissionEnabled] = useState(false)
  const [commissionIsPresident, setCommissionIsPresident] = useState(false)
  const [commissionSaving, setCommissionSaving] = useState(false)
  const [commissionHydrated, setCommissionHydrated] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createErrors, setCreateErrors] = useState<Partial<Record<keyof CreateCandidateUserInput, string>>>({})
  const [createForm, setCreateForm] = useState<CreateCandidateUserInput>({
    email: "",
    nom: "",
    prenom: "",
    date_naissance: "",
    etablissement: "",
    ville: "",
    departement: "",
    grade_actuel: "",
    date_recrutement_es: "",
    date_recrutement_fp: null,
    numero_som: "",
    telephone: "",
    specialite: "",
  })

  const [viewOpen, setViewOpen] = useState(false)
  const [viewed, setViewed] = useState<AdminUser | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let mounted = true
    me()
      .then((u) => {
        if (!mounted) return
        setCurrentUserId(typeof u?.id === "number" ? u.id : null)
      })
      .catch(() => {
        if (!mounted) return
        setCurrentUserId(null)
      })
    return () => {
      mounted = false
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    setFetching(true)
    try {
      const res = await usersAdminApi.getAll({
        q: q || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
        page,
        per_page: perPage,
      })
      setUsers(res.data)
      setPage(res.meta.page)
      setLastPage(res.meta.last_page)
      setTotal(res.meta.total)
    } catch (error) {
      if (error instanceof AdminApiError) {
        toast.error(error.message)
      } else {
        toast.error("Erreur lors du chargement des utilisateurs")
      }
    } finally {
      setFetching(false)
    }
  }, [q, roleFilter, page, perPage])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const openEdit = (u: AdminUser) => {
    setSelected(u)
    setEditName(u.name)
    setEditRole(u.role)

    // Reset commission UI state (will hydrate after fetch)
    setCommissionHydrated(false)
    setCommissionAssignments([])
    setCommissionSpecialite("")
    setCommissionEnabled(false)
    setCommissionIsPresident(u.role === "Président")

    setEditOpen(true)
  }

  const commissionSectionEnabled = editRole === "Commission" || editRole === "Président"

  useEffect(() => {
    if (!editOpen || !selected) return

    let mounted = true
    setSpecialitesLoading(true)
    setCommissionAssignmentsLoading(true)

    Promise.all([specialitesAdminApi.getAll(), commissionUsersAdminApi.getForUser(selected.id)])
      .then(([specRes, assignRes]) => {
        if (!mounted) return
        setSpecialites(specRes.data)
        setCommissionAssignments(assignRes.data.assignments)

        const defaultSpecialite =
          commissionSpecialite ||
          specRes.data?.[0]?.name ||
          ""

        setCommissionSpecialite(defaultSpecialite)
        setCommissionHydrated(true)
      })
      .catch((error) => {
        if (!mounted) return
        if (error instanceof AdminApiError) {
          toast.error(error.message)
        } else {
          toast.error("Erreur lors du chargement des spécialités")
        }
      })
      .finally(() => {
        if (!mounted) return
        setSpecialitesLoading(false)
        setCommissionAssignmentsLoading(false)
      })

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOpen, selected?.id])

  useEffect(() => {
    if (!commissionHydrated) return

    const assignment = commissionAssignments.find(
      (a) => (a.commission?.specialite || "") === (commissionSpecialite || "")
    )

    setCommissionEnabled(Boolean(assignment))
    setCommissionIsPresident(editRole === "Président" ? true : Boolean(assignment?.is_president))
  }, [commissionAssignments, commissionHydrated, commissionSpecialite, editRole])

  const refreshAssignments = useCallback(async (userId: number) => {
    const res = await commissionUsersAdminApi.getForUser(userId)
    setCommissionAssignments(res.data.assignments)
  }, [])

  const setCommissionMembership = async (nextEnabled: boolean) => {
    if (!selected) return
    if (!commissionSpecialite.trim()) {
      toast.error("Veuillez choisir une spécialité")
      return
    }

    setCommissionSaving(true)
    try {
      if (nextEnabled) {
        await commissionUsersAdminApi.assignForUser(selected.id, {
          specialite: commissionSpecialite.trim(),
          is_president: editRole === "Président" ? true : Boolean(commissionIsPresident),
        })
        toast.success("Affectation commission ajoutée")
      } else {
        await commissionUsersAdminApi.removeForUser(selected.id, {
          specialite: commissionSpecialite.trim(),
        })
        toast.success("Affectation commission supprimée")
      }

      await refreshAssignments(selected.id)
    } catch (error) {
      if (error instanceof AdminApiError) {
        const msg = error.errors ? Object.values(error.errors)[0]?.[0] : null
        toast.error(msg || error.message)
      } else {
        toast.error("Erreur lors de la mise à jour de l'affectation")
      }
    } finally {
      setCommissionSaving(false)
    }
  }

  const setPresidentFlag = async (nextIsPresident: boolean) => {
    setCommissionIsPresident(nextIsPresident)
    if (!commissionEnabled) return
    if (!selected) return
    if (!commissionSpecialite.trim()) return

    if (editRole === "Président") return

    setCommissionSaving(true)
    try {
      await commissionUsersAdminApi.assignForUser(selected.id, {
        specialite: commissionSpecialite.trim(),
        is_president: Boolean(nextIsPresident),
      })
      await refreshAssignments(selected.id)
      toast.success("Statut président mis à jour")
    } catch (error) {
      if (error instanceof AdminApiError) {
        const msg = error.errors ? Object.values(error.errors)[0]?.[0] : null
        toast.error(msg || error.message)
      } else {
        toast.error("Erreur lors de la mise à jour")
      }
    } finally {
      setCommissionSaving(false)
    }
  }

  const openView = (u: AdminUser) => {
    setViewed(u)
    setViewOpen(true)
  }

  const isEditingSelf = selected && currentUserId === selected.id

  const canEditSelected = useMemo(() => {
    return Boolean(selected)
  }, [selected])

  const saveEdit = async () => {
    if (!selected) return

    if (!editName.trim()) {
      toast.error("Le nom est requis")
      return
    }

    setSaving(true)
    try {
      const payload: { name?: string; role?: UserRole } = {
        name: editName.trim(),
      }

      if (!isEditingSelf) {
        payload.role = editRole
      }

      const res = await usersAdminApi.update(selected.id, payload)

      setUsers((prev) => prev.map((u) => (u.id === selected.id ? res.data : u)))
      toast.success("Utilisateur modifié")
      setEditOpen(false)
    } catch (error) {
      if (error instanceof AdminApiError) {
        const msg = error.errors ? Object.values(error.errors)[0]?.[0] : null
        toast.error(msg || error.message)
      } else {
        toast.error("Erreur lors de la modification")
      }
    } finally {
      setSaving(false)
    }
  }

  const submitCreate = async () => {
    const errors: Partial<Record<keyof CreateCandidateUserInput, string>> = {}

    if (!createForm.email.trim()) errors.email = "Email obligatoire"
    if (!createForm.nom.trim()) errors.nom = "Nom obligatoire"
    if (!createForm.prenom.trim()) errors.prenom = "Prénom obligatoire"
    if (!createForm.date_naissance.trim()) errors.date_naissance = "Date obligatoire"
    if (!createForm.etablissement.trim()) errors.etablissement = "Établissement obligatoire"
    if (!createForm.ville.trim()) errors.ville = "Ville obligatoire"
    if (!createForm.departement.trim()) errors.departement = "Département obligatoire"
    if (!createForm.grade_actuel.trim()) errors.grade_actuel = "Grade obligatoire"
    if (!createForm.date_recrutement_es.trim()) errors.date_recrutement_es = "Date obligatoire"
    if (!createForm.numero_som.trim()) errors.numero_som = "Numéro SOM obligatoire"
    if (!createForm.telephone.trim()) errors.telephone = "Téléphone obligatoire"
    if (!createForm.specialite.trim()) errors.specialite = "Spécialité obligatoire"

    setCreateErrors(errors)
    if (Object.keys(errors).length > 0) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }

    setCreating(true)
    try {
      await usersAdminApi.createCandidate({
        ...createForm,
        email: createForm.email.trim(),
        nom: createForm.nom.trim(),
        prenom: createForm.prenom.trim(),
        etablissement: createForm.etablissement.trim(),
        ville: createForm.ville.trim(),
        departement: createForm.departement.trim(),
        grade_actuel: createForm.grade_actuel.trim(),
        numero_som: createForm.numero_som.trim(),
        telephone: createForm.telephone.trim(),
        specialite: createForm.specialite.trim(),
        date_recrutement_fp: createForm.date_recrutement_fp || null,
      })

      toast.success("Utilisateur créé")
      setCreateOpen(false)
      setCreateErrors({})
      setCreateForm({
        email: "",
        nom: "",
        prenom: "",
        date_naissance: "",
        etablissement: "",
        ville: "",
        departement: "",
        grade_actuel: "",
        date_recrutement_es: "",
        date_recrutement_fp: null,
        numero_som: "",
        telephone: "",
        specialite: "",
      })

      // After creating, go back to first page to see it.
      setPage(1)
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

  const confirmDelete = async () => {
    if (!selected) return
    if (currentUserId === selected.id) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte")
      return
    }

    setDeleting(true)
    try {
      await usersAdminApi.delete(selected.id)
      toast.success("Compte supprimé")
      setUsers((prev) => prev.filter((u) => u.id !== selected.id))
      setDeleteConfirmOpen(false)
      setEditOpen(false)
      setSelected(null)
    } catch (error) {
      if (error instanceof AdminApiError) {
        const msg = error.errors ? Object.values(error.errors)[0]?.[0] : null
        toast.error(msg || error.message)
      } else {
        toast.error("Erreur lors de la suppression")
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Utilisateurs</h1>
        <p className="text-muted-foreground mt-1">Gérez les comptes et les rôles (y compris votre propre compte).</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <Label htmlFor="q">Recherche</Label>
          <Input
            id="q"
            value={q}
            placeholder="Nom ou email"
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div>
          <Label>Rôle</Label>
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v as UserRole | "all")
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={fetchUsers} disabled={fetching}>
          Rafraîchir
        </Button>
        <Button onClick={() => setCreateOpen(true)}>
          Ajouter un utilisateur
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Afficher</span>
          <Select
            value={String(perPage)}
            onValueChange={(v) => {
              setPerPage(Number(v) as 10 | 20 | 50 | 100)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer"
                  onClick={() => openView(u)}
                >
                  <TableCell className="font-medium">
                    {u.name}
                    {currentUserId === u.id ? (
                      <span className="ml-2 text-xs text-muted-foreground">(vous)</span>
                    ) : null}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEdit(u)
                      }}
                    >
                      Modifier
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total: {total}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={page <= 1 || fetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Précédent
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} / {lastPage}
          </div>
          <Button variant="outline" disabled={page >= lastPage || fetching} onClick={() => setPage((p) => Math.min(lastPage, p + 1))}>
            Suivant
          </Button>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
            <DialogDescription>
              Vous pouvez modifier votre propre compte aussi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={!canEditSelected}
              />
            </div>

            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={editRole}
                onValueChange={(v) => setEditRole(v as UserRole)}
                disabled={Boolean(isEditingSelf)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {commissionSectionEnabled ? (
              <div className="space-y-3 rounded-md border p-3">
                <div className="text-sm font-medium">Commission</div>

                <div className="space-y-2">
                  <Label>Spécialité</Label>
                  {specialites.length > 0 ? (
                    <Select
                      value={commissionSpecialite}
                      onValueChange={(v) => setCommissionSpecialite(v)}
                      disabled={specialitesLoading || commissionAssignmentsLoading || commissionSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={specialitesLoading ? "Chargement..." : "Choisir une spécialité"} />
                      </SelectTrigger>
                      <SelectContent>
                        {specialites.map((s) => (
                          <SelectItem key={s.id} value={s.name}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={commissionSpecialite}
                      onChange={(e) => setCommissionSpecialite(e.target.value)}
                      disabled={specialitesLoading || commissionAssignmentsLoading || commissionSaving}
                      placeholder={specialitesLoading ? "Chargement..." : "Saisir une spécialité"}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={commissionEnabled}
                    disabled={!selected || commissionSaving || commissionAssignmentsLoading}
                    onCheckedChange={(v) => setCommissionMembership(Boolean(v))}
                  />
                  <div className="text-sm">Affecter à la commission</div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={editRole === "Président" ? true : commissionIsPresident}
                    disabled={!commissionEnabled || commissionSaving || commissionAssignmentsLoading || editRole === "Président"}
                    onCheckedChange={(v) => setPresidentFlag(Boolean(v))}
                  />
                  <div className="text-sm">Président</div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Max 4 membres + 1 président (contrôlé côté serveur).
                </div>
              </div>
            ) : (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                Pour affecter à une commission, mettez le rôle à Commission ou Président.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={saveEdit} disabled={saving || !selected}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button
              variant="destructive"
              disabled={!selected || deleting || Boolean(isEditingSelf)}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              Supprimer le compte
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le compte</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border p-3 text-sm">
            <div className="font-medium">{selected?.name}</div>
            <div className="text-muted-foreground">{selected?.email}</div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={deleting}>
                Annuler
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <IconLoader2 className="size-4 animate-spin" /> Suppression...
                </span>
              ) : (
                "Supprimer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur (Candidat)</DialogTitle>
            <DialogDescription>
              Saisissez les informations du candidat.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="create_email">Email *</Label>
              <Input
                id="create_email"
                type="email"
                value={createForm.email}
                className={createErrors.email ? "border-destructive" : undefined}
                onChange={(e) => {
                  setCreateForm((p) => ({ ...p, email: e.target.value }))
                  setCreateErrors((prev) => ({ ...prev, email: undefined }))
                }}
              />
              {createErrors.email ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <IconAlertCircle className="size-4" /> {createErrors.email}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create_nom">Nom *</Label>
              <Input
                id="create_nom"
                value={createForm.nom}
                className={createErrors.nom ? "border-destructive" : undefined}
                onChange={(e) => {
                  setCreateForm((p) => ({ ...p, nom: e.target.value }))
                  setCreateErrors((prev) => ({ ...prev, nom: undefined }))
                }}
              />
              {createErrors.nom ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <IconAlertCircle className="size-4" /> {createErrors.nom}
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_prenom">Prénom *</Label>
              <Input
                id="create_prenom"
                value={createForm.prenom}
                className={createErrors.prenom ? "border-destructive" : undefined}
                onChange={(e) => {
                  setCreateForm((p) => ({ ...p, prenom: e.target.value }))
                  setCreateErrors((prev) => ({ ...prev, prenom: undefined }))
                }}
              />
              {createErrors.prenom ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <IconAlertCircle className="size-4" /> {createErrors.prenom}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create_date_naissance">Date de naissance *</Label>
              <Input
                id="create_date_naissance"
                type="date"
                value={createForm.date_naissance}
                className={createErrors.date_naissance ? "border-destructive" : undefined}
                onChange={(e) => {
                  setCreateForm((p) => ({ ...p, date_naissance: e.target.value }))
                  setCreateErrors((prev) => ({ ...prev, date_naissance: undefined }))
                }}
              />
              {createErrors.date_naissance ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <IconAlertCircle className="size-4" /> {createErrors.date_naissance}
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_etablissement">Établissement *</Label>
              <Input
                id="create_etablissement"
                value={createForm.etablissement}
                className={createErrors.etablissement ? "border-destructive" : undefined}
                onChange={(e) => {
                  setCreateForm((p) => ({ ...p, etablissement: e.target.value }))
                  setCreateErrors((prev) => ({ ...prev, etablissement: undefined }))
                }}
              />
              {createErrors.etablissement ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <IconAlertCircle className="size-4" /> {createErrors.etablissement}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create_ville">Ville *</Label>
              <Input
                id="create_ville"
                value={createForm.ville}
                className={createErrors.ville ? "border-destructive" : undefined}
                onChange={(e) => {
                  setCreateForm((p) => ({ ...p, ville: e.target.value }))
                  setCreateErrors((prev) => ({ ...prev, ville: undefined }))
                }}
              />
              {createErrors.ville ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <IconAlertCircle className="size-4" /> {createErrors.ville}
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_departement">Département *</Label>
              <Input
                id="create_departement"
                value={createForm.departement}
                className={createErrors.departement ? "border-destructive" : undefined}
                onChange={(e) => {
                  setCreateForm((p) => ({ ...p, departement: e.target.value }))
                  setCreateErrors((prev) => ({ ...prev, departement: undefined }))
                }}
              />
              {createErrors.departement ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <IconAlertCircle className="size-4" /> {createErrors.departement}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create_grade">Grade actuel *</Label>
              <Input
                id="create_grade"
                value={createForm.grade_actuel}
                className={createErrors.grade_actuel ? "border-destructive" : undefined}
                onChange={(e) => {
                  setCreateForm((p) => ({ ...p, grade_actuel: e.target.value }))
                  setCreateErrors((prev) => ({ ...prev, grade_actuel: undefined }))
                }}
              />
              {createErrors.grade_actuel ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <IconAlertCircle className="size-4" /> {createErrors.grade_actuel}
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_date_es">Date de recrutement (ES) *</Label>
              <Input
                id="create_date_es"
                type="date"
                value={createForm.date_recrutement_es}
                className={createErrors.date_recrutement_es ? "border-destructive" : undefined}
                onChange={(e) => {
                  setCreateForm((p) => ({ ...p, date_recrutement_es: e.target.value }))
                  setCreateErrors((prev) => ({ ...prev, date_recrutement_es: undefined }))
                }}
              />
              {createErrors.date_recrutement_es ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <IconAlertCircle className="size-4" /> {createErrors.date_recrutement_es}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create_date_fp">Date recrutement FP (si applicable)</Label>
              <Input
                id="create_date_fp"
                type="date"
                value={createForm.date_recrutement_fp ?? ""}
                onChange={(e) =>
                  setCreateForm((p) => ({
                    ...p,
                    date_recrutement_fp: e.target.value || null,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_som">Numéro SOM *</Label>
              <Input
                id="create_som"
                value={createForm.numero_som}
                className={createErrors.numero_som ? "border-destructive" : undefined}
                onChange={(e) => {
                  setCreateForm((p) => ({ ...p, numero_som: e.target.value }))
                  setCreateErrors((prev) => ({ ...prev, numero_som: undefined }))
                }}
              />
              {createErrors.numero_som ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <IconAlertCircle className="size-4" /> {createErrors.numero_som}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create_tel">Numéro de téléphone *</Label>
              <Input
                id="create_tel"
                value={createForm.telephone}
                className={createErrors.telephone ? "border-destructive" : undefined}
                onChange={(e) => {
                  setCreateForm((p) => ({ ...p, telephone: e.target.value }))
                  setCreateErrors((prev) => ({ ...prev, telephone: undefined }))
                }}
              />
              {createErrors.telephone ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <IconAlertCircle className="size-4" /> {createErrors.telephone}
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_spec">Spécialité *</Label>
              <Input
                id="create_spec"
                value={createForm.specialite}
                className={createErrors.specialite ? "border-destructive" : undefined}
                onChange={(e) => {
                  setCreateForm((p) => ({ ...p, specialite: e.target.value }))
                  setCreateErrors((prev) => ({ ...prev, specialite: undefined }))
                }}
              />
              {createErrors.specialite ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <IconAlertCircle className="size-4" /> {createErrors.specialite}
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={submitCreate} disabled={creating}>
              {creating ? "Création..." : "Créer"}
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Informations utilisateur</DialogTitle>
            <DialogDescription>Consultez les informations du compte.</DialogDescription>
          </DialogHeader>

          {viewed ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-md border p-3">
                <div className="font-medium">{viewed.name}</div>
                <div className="text-muted-foreground">{viewed.email}</div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground">Rôle</div>
                  <div className="font-medium">{viewed.role}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground">ID</div>
                  <div className="font-medium">{viewed.id}</div>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fermer</Button>
            </DialogClose>
            {viewed ? (
              <Button
                onClick={() => {
                  setViewOpen(false)
                  openEdit(viewed)
                }}
              >
                Modifier
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
