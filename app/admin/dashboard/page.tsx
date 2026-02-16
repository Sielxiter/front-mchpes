"use client"

import * as React from "react"
import { toast } from "sonner"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { IconFileDescription, IconSend, IconUsers } from "@tabler/icons-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { analyticsAdminApi, type AnalyticsOverview } from "@/lib/api/admin"

export default function AdminDashboardPage() {
  const [overview, setOverview] = React.useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        const res = await analyticsAdminApi.getOverview({ days: 14, recent_limit: 6 })
        if (!mounted) return
        setOverview(res.data)
      } catch {
        if (!mounted) return
        setOverview(null)
        toast.error("Impossible de charger les statistiques")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const chartConfig = React.useMemo(
    () =>
      ({
        dossiers_created: {
          label: "Dossiers créés",
          color: "var(--color-chart-1)",
        },
        dossiers_submitted: {
          label: "Dossiers soumis",
          color: "var(--color-chart-2)",
        },
      }) satisfies ChartConfig,
    []
  )

  const totals = overview?.totals
  const series = overview?.series ?? []
  const recentCandidates = overview?.recent_candidates ?? []

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Aperçu général du système.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Total dossiers</span>
              <IconFileDescription className="size-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3">
              <div className="text-4xl font-semibold leading-none">
                {loading ? "…" : totals?.dossiers_total ?? "-"}
              </div>
              <div className="text-xs text-muted-foreground">Tous statuts</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Dossiers soumis</span>
              <IconSend className="size-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3">
              <div className="text-4xl font-semibold leading-none">
                {loading ? "…" : totals?.dossiers_submitted ?? "-"}
              </div>
              <div className="text-xs text-muted-foreground">Statut: submitted</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Total candidats</span>
              <IconUsers className="size-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3">
              <div className="text-4xl font-semibold leading-none">
                {loading ? "…" : totals?.candidats_total ?? "-"}
              </div>
              <div className="text-xs text-muted-foreground">Utilisateurs rôle Candidat</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activité (14 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <AreaChart data={series} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Area
                  type="monotone"
                  dataKey="dossiers_created"
                  stroke="var(--color-dossiers_created)"
                  fill="var(--color-dossiers_created)"
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="dossiers_submitted"
                  stroke="var(--color-dossiers_submitted)"
                  fill="var(--color-dossiers_submitted)"
                  fillOpacity={0.10}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Derniers candidats inscrits</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Chargement…</div>
            ) : recentCandidates.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucun candidat trouvé.</div>
            ) : (
              <div className="space-y-3">
                {recentCandidates.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{c.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.email}</div>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
