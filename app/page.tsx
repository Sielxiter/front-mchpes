import type { Metadata } from "next"

import Landing from "./landing/Landing"

export const metadata: Metadata = {
  title: "Accueil - MCH → PES",
  description: "Plateforme de postulation MCH → PES",
}

export default function Home() {
  return <Landing />
}
