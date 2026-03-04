"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { IconLoader2 } from "@tabler/icons-react"

export default function ActivitesEnseignementIndex() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/candidat/candidature/activites-enseignement/a1")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <IconLoader2 className="size-8 animate-spin" />
    </div>
  )
}
