import type { Metadata } from "next"

import Landing from "./Landing"

export const metadata: Metadata = {
  title: "Accueil - MCH → PES",
  description: "Plateforme de postulation MCH → PES",
}

export default function LandingPage() {
  return <Landing />
}
