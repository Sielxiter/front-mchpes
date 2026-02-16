"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconTrash, IconBell, IconLoader2, IconAlertCircle } from "@tabler/icons-react"
import { deadlinesAdminApi, type AdminDeadline, AdminApiError } from "@/lib/api"

interface DeadlineForm {
  stage: string
  due_at: string
  reminder_enabled: boolean
}

export default function Page() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [deadlines, setDeadlines] = useState<AdminDeadline[]>([])
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof DeadlineForm, string>>>({})
  const [form, setForm] = useState<DeadlineForm>({
    stage: "",
    due_at: "",
    reminder_enabled: false,
  })

  const fetchDeadlines = useCallback(async () => {
    setFetching(true)
    try {
      const response = await deadlinesAdminApi.getAll()
      setDeadlines(response.data)
    } catch (error) {
      console.error("Failed to fetch deadlines", error)
      if (error instanceof AdminApiError) {
        toast.error(error.message)
      } else {
        toast.error("Erreur lors du chargement des délais")
      }
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    fetchDeadlines()
  }, [fetchDeadlines])

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await deadlinesAdminApi.delete(id)
      toast.success("Délai supprimé")
      setDeadlines((prev) => prev.filter((d) => d.id !== id))
    } catch (error) {
      if (error instanceof AdminApiError) {
        toast.error(error.message)
      } else {
        toast.error("Erreur lors de la suppression")
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors: Partial<Record<keyof DeadlineForm, string>> = {}
    if (!form.stage.trim()) nextErrors.stage = "Étape obligatoire"
    if (!form.due_at.trim()) nextErrors.due_at = "Date d'échéance obligatoire"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }

    setLoading(true)
    try {
      await deadlinesAdminApi.create({
        stage: form.stage,
        due_at: form.due_at,
        reminder_enabled: form.reminder_enabled,
      })
      toast.success("Délai créé avec succès")
      setForm({ stage: "", due_at: "", reminder_enabled: false })
      setErrors({})
      setOpen(false)
      fetchDeadlines()
    } catch (error) {
      if (error instanceof AdminApiError) {
        if (error.errors) {
          const firstError = Object.values(error.errors)[0]?.[0]
          toast.error(firstError || error.message)
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error("Erreur lors de la création")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Délais et Échéances</h1>
          <p className="text-muted-foreground mt-1">
            Définissez les délais pour chaque étape et suivez les rappels.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Ajouter un délai</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau délai</DialogTitle>
              <DialogDescription>
                Définissez un délai et une date d&apos;échéance pour une étape du processus.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="stage">Étape</Label>
                <Input
                  id="stage"
                  placeholder="ex: Étape de présélection"
                  value={form.stage}
                  className={errors.stage ? "border-destructive" : undefined}
                  onChange={(e) => {
                    setForm({ ...form, stage: e.target.value })
                    setErrors((prev) => ({ ...prev, stage: undefined }))
                  }}
                  required
                />
                {errors.stage ? (
                  <div className="mt-1 flex items-center gap-2 text-sm text-destructive">
                    <IconAlertCircle className="size-4" /> {errors.stage}
                  </div>
                ) : null}
              </div>
              <div>
                <Label htmlFor="due_at">Date d&apos;échéance</Label>
                <Input
                  id="due_at"
                  type="datetime-local"
                  value={form.due_at}
                  className={errors.due_at ? "border-destructive" : undefined}
                  onChange={(e) => {
                    setForm({ ...form, due_at: e.target.value })
                    setErrors((prev) => ({ ...prev, due_at: undefined }))
                  }}
                  required
                />
                {errors.due_at ? (
                  <div className="mt-1 flex items-center gap-2 text-sm text-destructive">
                    <IconAlertCircle className="size-4" /> {errors.due_at}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="reminder"
                  checked={form.reminder_enabled}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, reminder_enabled: !!checked })
                  }
                />
                <Label htmlFor="reminder">Activer les rappels</Label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "Création..." : "Créer le délai"}
                </Button>
                <DialogClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Deadlines Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Étape</TableHead>
              <TableHead>Date d&apos;échéance</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Rappels</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <IconLoader2 className="size-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : deadlines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Aucun délai configuré
                </TableCell>
              </TableRow>
            ) : (
              deadlines.map((deadline) => (
                <TableRow key={deadline.id}>
                  <TableCell className="font-medium">{deadline.stage}</TableCell>
                  <TableCell>
                    {deadline.due_at_formatted || new Date(deadline.due_at).toLocaleString("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell>
                    {deadline.is_expired ? (
                      <span className="text-red-600">Expiré</span>
                    ) : (
                      <span className="text-green-600">
                        {deadline.days_remaining} jour{deadline.days_remaining !== 1 ? "s" : ""} restant{deadline.days_remaining !== 1 ? "s" : ""}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {deadline.reminder_enabled ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <IconBell className="size-4" /> Activé
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Désactivé</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(deadline.id)}
                      disabled={deletingId === deadline.id}
                    >
                      {deletingId === deadline.id ? (
                        <IconLoader2 className="size-4 animate-spin" />
                      ) : (
                        <IconTrash className="size-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
