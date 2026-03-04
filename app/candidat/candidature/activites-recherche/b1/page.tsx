"use client"

import ActivityCategoryPage from "@/components/activity-category-page"

const SUBCATEGORIES = [
  "Publication dans une revue indexée",
  "Brevet déposé ou exploité",
  "Direction de thèse soutenue",
  "Co-direction de thèse soutenue",
]

export default function B1Page() {
  return (
    <ActivityCategoryPage
      type="recherche"
      category="B/1"
      categoryTitle="B/1 - Production scientifique"
      subcategories={SUBCATEGORIES}
      draftKey="activites_rech_b1"
      backUrl="/candidat/candidature/activites-enseignement/a3"
      nextUrl="/candidat/candidature/activites-recherche/b2"
      stepTitle="Activités de recherche — B/1"
      stepDescription="Production scientifique"
    />
  )
}
