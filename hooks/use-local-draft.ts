"use client"

import { useState, useEffect, useCallback } from "react"

const DRAFT_PREFIX = "candidature_draft_"

/**
 * Hook for persisting form data to localStorage as a draft
 * Automatically saves on changes and loads on mount
 */
export function useLocalDraft<T extends object>(
  key: string,
  initialValue: T
): {
  data: T
  setData: React.Dispatch<React.SetStateAction<T>>
  updateField: <K extends keyof T>(field: K, value: T[K]) => void
  clearDraft: () => void
  isDraftLoaded: boolean
  lastSaved: Date | null
} {
  const storageKey = `${DRAFT_PREFIX}${key}`
  const [data, setData] = useState<T>(initialValue)
  const [isDraftLoaded, setIsDraftLoaded] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        setData((prev) => ({ ...prev, ...parsed.data }))
        if (parsed.savedAt) {
          setLastSaved(new Date(parsed.savedAt))
        }
      }
    } catch (error) {
      console.error("Failed to load draft from localStorage:", error)
    }
    setIsDraftLoaded(true)
  }, [storageKey])

  // Save to localStorage when data changes (debounced)
  useEffect(() => {
    if (!isDraftLoaded) return

    const timer = setTimeout(() => {
      try {
        const payload = {
          data,
          savedAt: new Date().toISOString(),
        }
        localStorage.setItem(storageKey, JSON.stringify(payload))
        setLastSaved(new Date())
      } catch (error) {
        console.error("Failed to save draft to localStorage:", error)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [data, storageKey, isDraftLoaded])

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      setLastSaved(null)
    } catch (error) {
      console.error("Failed to clear draft:", error)
    }
  }, [storageKey])

  return { data, setData, updateField, clearDraft, isDraftLoaded, lastSaved }
}

/**
 * Hook for persisting array data to localStorage
 */
export function useLocalDraftArray<T>(
  key: string,
  initialValue: T[] = []
): {
  items: T[]
  setItems: React.Dispatch<React.SetStateAction<T[]>>
  addItem: (item: T) => void
  removeItem: (predicate: (item: T) => boolean) => void
  clearDraft: () => void
  isDraftLoaded: boolean
  lastSaved: Date | null
} {
  const storageKey = `${DRAFT_PREFIX}${key}`
  const [items, setItems] = useState<T[]>(initialValue)
  const [isDraftLoaded, setIsDraftLoaded] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed.data)) {
          setItems(parsed.data)
        }
        if (parsed.savedAt) {
          setLastSaved(new Date(parsed.savedAt))
        }
      }
    } catch (error) {
      console.error("Failed to load draft from localStorage:", error)
    }
    setIsDraftLoaded(true)
  }, [storageKey])

  // Save to localStorage when items change (debounced)
  useEffect(() => {
    if (!isDraftLoaded) return

    const timer = setTimeout(() => {
      try {
        const payload = {
          data: items,
          savedAt: new Date().toISOString(),
        }
        localStorage.setItem(storageKey, JSON.stringify(payload))
        setLastSaved(new Date())
      } catch (error) {
        console.error("Failed to save draft to localStorage:", error)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [items, storageKey, isDraftLoaded])

  const addItem = useCallback((item: T) => {
    setItems((prev) => [...prev, item])
  }, [])

  const removeItem = useCallback((predicate: (item: T) => boolean) => {
    setItems((prev) => prev.filter((item) => !predicate(item)))
  }, [])

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      setItems([])
      setLastSaved(null)
    } catch (error) {
      console.error("Failed to clear draft:", error)
    }
  }, [storageKey])

  return { items, setItems, addItem, removeItem, clearDraft, isDraftLoaded, lastSaved }
}

/**
 * Clear all candidature drafts
 */
export function clearAllDrafts(): void {
  try {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(DRAFT_PREFIX))
    keys.forEach((key) => localStorage.removeItem(key))
  } catch (error) {
    console.error("Failed to clear all drafts:", error)
  }
}
