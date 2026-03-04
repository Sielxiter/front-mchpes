"use client"

import ActivityCategoryPage from "@/components/activity-category-page"

const SUBCATEGORIES = [
  "Tutorat d'étudiants (PFE, stages...)",
  "Organisation de manifestations scientifiques ou pédagogiques",
  "Participation active aux travaux des commissions pédagogiques",
]

export default function A3Page() {
  return (
    <ActivityCategoryPage
      type="enseignement"
      category="A/3"
      categoryTitle="A/3 - Responsabilités pédagogiques"
      subcategories={SUBCATEGORIES}
      draftKey="activites_ens_a3"
      backUrl="/candidat/candidature/activites-enseignement/a2"
      nextUrl="/candidat/candidature/activites-recherche/b1"
      stepTitle="Activités d'enseignement — A/3"
      stepDescription="Responsabilités pédagogiques"
    />
  )
}
