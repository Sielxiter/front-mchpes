"use client"

import ActivityCategoryPage from "@/components/activity-category-page"

const SUBCATEGORIES = [
  "Encadrement de PFE Licence, Master, Ingénieur",
  "Encadrement de stages et visites de terrain",
  "Formation de formateurs et personnel",
]

export default function A2Page() {
  return (
    <ActivityCategoryPage
      type="enseignement"
      category="A/2"
      categoryTitle="A/2 - Encadrement pédagogique"
      subcategories={SUBCATEGORIES}
      draftKey="activites_ens_a2"
      backUrl="/candidat/candidature/activites-enseignement/a1"
      nextUrl="/candidat/candidature/activites-enseignement/a3"
      stepTitle="Activités d'enseignement — A/2"
      stepDescription="Encadrement pédagogique"
    />
  )
}
