"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { settingsAdminApi, type AdminSettings } from "@/lib/api/admin"

export default function AdminParametresPage() {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const [form, setForm] = React.useState<AdminSettings>({
    app_name: "",
    contact_email: "",
    candidature_open: true,
  })

  React.useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        const res = await settingsAdminApi.get()
        if (!mounted) return
        setForm(res.data)
      } catch {
        if (!mounted) return
        toast.error("Impossible de charger les paramètres")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  const onSave = async () => {
    try {
      setSaving(true)
      const res = await settingsAdminApi.update(form)
      setForm(res.data)
      toast.success(res.message || "Paramètres enregistrés")
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur lors de l'enregistrement"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="mt-1 text-muted-foreground">Configuration générale du système.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Général</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-medium">Nom de l’application</div>
            <Input
              disabled={loading || saving}
              value={form.app_name}
              onChange={(e) => setForm((f) => ({ ...f, app_name: e.target.value }))}
              placeholder="Ex: Plateforme de candidature"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Email de contact</div>
            <Input
              disabled={loading || saving}
              value={form.contact_email}
              onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
              placeholder="contact@example.com"
            />
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              disabled={loading || saving}
              checked={form.candidature_open}
              onCheckedChange={(v) => setForm((f) => ({ ...f, candidature_open: v === true }))}
            />
            <div className="space-y-1">
              <div className="text-sm font-medium">Candidatures ouvertes</div>
              <div className="text-sm text-muted-foreground">
                Active ou désactive la possibilité de déposer une candidature.
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button disabled={loading || saving} onClick={onSave}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
