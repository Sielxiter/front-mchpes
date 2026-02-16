"use client"

import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type PdfListDocument = {
  id: number
  category: string
  original_name: string
  type: string
}

export type PdfListProps = {
  documents: PdfListDocument[]
  selectedId: number | null
  onSelect: (documentId: number) => void
  onLoadMore?: () => void
  hasMore?: boolean
  loadingMore?: boolean
  className?: string
}

export function PdfList({
  documents,
  selectedId,
  onSelect,
  onLoadMore,
  hasMore,
  loadingMore,
  className,
}: PdfListProps) {
  const groups = useMemo(() => {
    const map = new Map<string, PdfListDocument[]>()
    for (const doc of documents) {
      const key = doc.category || "Autres"
      const list = map.get(key) || []
      list.push(doc)
      map.set(key, list)
    }
    return Array.from(map.entries())
  }, [documents])

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Documents (PDF)</CardTitle>
        <CardDescription>
          {documents.length === 0 ? "Aucun PDF" : "Sélectionnez un document"}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-4">
          {groups.map(([category, docs]) => (
            <div key={category} className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">
                {category}
              </div>
              <div className="space-y-1">
                {docs.map((doc) => {
                  const active = doc.id === selectedId
                  return (
                    <Button
                      key={doc.id}
                      type="button"
                      variant={active ? "secondary" : "ghost"}
                      className={cn(
                        "h-auto w-full justify-start px-2 py-2 text-left",
                        active && "font-semibold"
                      )}
                      onClick={() => onSelect(doc.id)}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm">{doc.original_name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          #{doc.id} • {doc.type}
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}

          {hasMore ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Chargement..." : "Charger plus"}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
