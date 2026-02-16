"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { IconCheck, IconLoader2, IconPlus, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { enseignementsApi, ApiRequestError } from "@/lib/api"
import { useLocalDraftArray } from "@/hooks/use-local-draft"

interface Enseignement {
  id: string
  annee_universitaire: string
  intitule: string
  type_enseignement: "CM" | "TD" | "TP"
  type_module: "Module" | "Element de module"
  niveau: string
  volume_horaire: number
  equivalent_tp: number
}

const NIVEAUX = ["L1", "L2", "L3", "M1", "M2", "CP1", "CP2", "CI1", "CI2", "CI3", "Doctorat"]
const ANNEES = Array.from({ length: 20 }, (_, i) => {
  const year = 2026 - i
  return `${year - 1}/${year}`
})

// Conversion factors to TP equivalent
const CONVERSION_FACTORS: Record<string, number> = {
  CM: 1.5,
  TD: 1.25,
  TP: 1,
}

export default function EnseignementsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Use localStorage for draft persistence
  const { 
    items: enseignements, 
    setItems: setEnseignements, 
    clearDraft,
    lastSaved 
  } = useLocalDraftArray<Enseignement>("enseignements", [])
  
  const [newEntry, setNewEntry] = useState<Partial<Enseignement>>({
    annee_universitaire: ANNEES[0],
    type_enseignement: "CM",
    type_module: "Module",
    niveau: "L1",
  })

  // Load from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await enseignementsApi.getAll()
        if (response.enseignements.length > 0) {
          // Use API data if available, mapping to local format
          setEnseignements(response.enseignements.map(e => ({
            id: String(e.id),
            annee_universitaire: e.annee_universitaire,
            intitule: e.intitule,
            type_enseignement: e.type_enseignement,
            type_module: e.type_module,
            niveau: e.niveau,
            volume_horaire: Number(e.volume_horaire),
            equivalent_tp: Number(e.equivalent_tp),
          })))
        }
      } catch {
        // API failed, will use localStorage draft
      } finally {
        setInitialLoading(false)
      }
    }
    loadData()
  }, [setEnseignements])

  // Auto-save to API
  const autoSave = useCallback(async () => {
    if (enseignements.length === 0) return
    setSaving(true)
    try {
      await enseignementsApi.bulkSave(
        enseignements.map(e => ({
          annee_universitaire: e.annee_universitaire,
          intitule: e.intitule,
          type_enseignement: e.type_enseignement,
          type_module: e.type_module,
          niveau: e.niveau,
          volume_horaire: e.volume_horaire,
        }))
      )
    } catch {
      // Silent fail - localStorage backup is there
    } finally {
      setSaving(false)
    }
  }, [enseignements])

  useEffect(() => {
    if (initialLoading) return
    const timer = setTimeout(() => {
      if (enseignements.length > 0) {
        autoSave()
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [enseignements, autoSave, initialLoading])

  const addEnseignement = () => {
    if (!newEntry.intitule || !newEntry.volume_horaire) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    const volumeHoraire = Number(newEntry.volume_horaire)
    const equivalentTp = volumeHoraire * CONVERSION_FACTORS[newEntry.type_enseignement || "TP"]

    const entry: Enseignement = {
      id: crypto.randomUUID(),
      annee_universitaire: newEntry.annee_universitaire || ANNEES[0],
      intitule: newEntry.intitule || "",
      type_enseignement: newEntry.type_enseignement as "CM" | "TD" | "TP",
      type_module: newEntry.type_module as "Module" | "Element de module",
      niveau: newEntry.niveau || "L1",
      volume_horaire: volumeHoraire,
      equivalent_tp: equivalentTp,
    }

    setEnseignements([...enseignements, entry])
    setNewEntry({
      annee_universitaire: newEntry.annee_universitaire,
      type_enseignement: "CM",
      type_module: "Module",
      niveau: "L1",
      intitule: "",
      volume_horaire: undefined,
    })
    toast.success("Enseignement ajouté")
  }

  const removeEnseignement = (id: string) => {
    setEnseignements(enseignements.filter((e) => e.id !== id))
    toast.success("Enseignement supprimé")
  }

  // Group by year and calculate totals
  const groupedByYear = enseignements.reduce((acc, e) => {
    if (!acc[e.annee_universitaire]) {
      acc[e.annee_universitaire] = []
    }
    acc[e.annee_universitaire].push(e)
    return acc
  }, {} as Record<string, Enseignement[]>)

  const totalEquivalentTp = enseignements.reduce((sum, e) => sum + Number(e.equivalent_tp ?? 0), 0)

  const handleSubmit = async () => {
    if (enseignements.length === 0) {
      toast.error("Veuillez ajouter au moins un enseignement")
      return
    }

    setLoading(true)
    try {
      await enseignementsApi.bulkSave(
        enseignements.map(e => ({
          annee_universitaire: e.annee_universitaire,
          intitule: e.intitule,
          type_enseignement: e.type_enseignement,
          type_module: e.type_module,
          niveau: e.niveau,
          volume_horaire: e.volume_horaire,
        }))
      )
      clearDraft()
      toast.success("Enseignements enregistrés")
      router.push("/candidat/candidature/pfe")
    } catch (error) {
      if (error instanceof ApiRequestError) {
        toast.error(error.message)
      } else {
        toast.error("Erreur lors de l&apos;enregistrement")
      }
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Étape 2 : Responsabilités pédagogiques</h1>
          <p className="text-muted-foreground mt-1">
            Décrivez vos enseignements effectués par année universitaire.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {saving ? (
            <>
              <IconLoader2 className="size-4 animate-spin" />
              Sauvegarde...
            </>
          ) : lastSaved ? (
            <>
              <IconCheck className="size-4 text-green-600" />
              Sauvegardé à {lastSaved.toLocaleTimeString("fr-FR")}
            </>
          ) : null}
        </div>
      </div>

      {/* Add Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un enseignement</CardTitle>
          <CardDescription>
            Renseignez les détails de chaque enseignement effectué.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Année universitaire</Label>
              <Select
                value={newEntry.annee_universitaire}
                onValueChange={(v) => setNewEntry({ ...newEntry, annee_universitaire: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANNEES.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type d&apos;enseignement</Label>
              <Select
                value={newEntry.type_enseignement}
                onValueChange={(v) => setNewEntry({ ...newEntry, type_enseignement: v as "CM" | "TD" | "TP" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CM">CM (Cours Magistral)</SelectItem>
                  <SelectItem value="TD">TD (Travaux Dirigés)</SelectItem>
                  <SelectItem value="TP">TP (Travaux Pratiques)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type de module</Label>
              <Select
                value={newEntry.type_module}
                onValueChange={(v) => setNewEntry({ ...newEntry, type_module: v as "Module" | "Element de module" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Module">Module</SelectItem>
                  <SelectItem value="Element de module">Élément de module</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <Label>Niveau</Label>
              <Select
                value={newEntry.niveau}
                onValueChange={(v) => setNewEntry({ ...newEntry, niveau: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NIVEAUX.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Intitulé</Label>
              <Input
                placeholder="Nom du cours ou module"
                value={newEntry.intitule || ""}
                onChange={(e) => setNewEntry({ ...newEntry, intitule: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Volume horaire annuel</Label>
              <Input
                type="number"
                min="0"
                placeholder="Heures"
                value={newEntry.volume_horaire || ""}
                onChange={(e) => setNewEntry({ ...newEntry, volume_horaire: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Équivalent TP (calculé)</Label>
              <Input
                disabled
                value={
                  newEntry.volume_horaire
                    ? (Number(newEntry.volume_horaire) * CONVERSION_FACTORS[newEntry.type_enseignement || "TP"]).toFixed(2)
                    : ""
                }
                className="bg-muted"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addEnseignement} className="w-full">
                <IconPlus className="mr-2 size-4" />
                Ajouter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {enseignements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Enseignements déclarés</CardTitle>
            <CardDescription>
              Total: {enseignements.length} enseignement(s) | {totalEquivalentTp.toFixed(2)} heures équivalent TP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Année</TableHead>
                    <TableHead>Intitulé</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead className="text-right">Vol. horaire</TableHead>
                    <TableHead className="text-right">Eq. TP</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedByYear).map(([year, items]) => (
                    <React.Fragment key={year}>
                      {items.map((e, idx) => (
                        <TableRow key={e.id}>
                          {idx === 0 && (
                            <TableCell rowSpan={items.length} className="font-medium bg-muted/50">
                              {year}
                            </TableCell>
                          )}
                          <TableCell>{e.intitule}</TableCell>
                          <TableCell>{e.type_enseignement}</TableCell>
                          <TableCell>{e.type_module}</TableCell>
                          <TableCell>{e.niveau}</TableCell>
                          <TableCell className="text-right">{e.volume_horaire}h</TableCell>
                          <TableCell className="text-right">{Number(e.equivalent_tp ?? 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeEnseignement(e.id)}
                            >
                              <IconTrash className="size-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5}>Total général</TableCell>
                    <TableCell className="text-right font-bold">
                      {enseignements.reduce((s, e) => s + e.volume_horaire, 0)}h
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {totalEquivalentTp.toFixed(2)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <strong>Note:</strong> Un PDF récapitulatif avec déclaration sur l&apos;honneur sera généré automatiquement.
            Vous devrez le signer et le téléverser.
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => router.push("/candidat/candidature/profil")}>
          Retour
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <IconLoader2 className="mr-2 size-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Enregistrer et continuer"
          )}
        </Button>
      </div>
    </div>
  )
}
