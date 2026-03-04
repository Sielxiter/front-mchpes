"use client"

import ActivityCategoryPage from "@/components/activity-category-page"

const SUBCATEGORIES = [
  "Publication dans les actes de congrès indexés",
  "Publication dans une revue spécialisée non indexée",
  "Direction de thèses en cours d'un doctorant inscrit",
]

export default function B2Page() {
  return (
    <ActivityCategoryPage
      type="recherche"
      category="B/2"
      categoryTitle="B/2 - Encadrement scientifique"
      subcategories={SUBCATEGORIES}
      draftKey="activites_rech_b2"
      backUrl="/candidat/candidature/activites-recherche/b1"
      nextUrl="/candidat/candidature/activites-recherche/b3"
      stepTitle="Activités de recherche — B/2"
      stepDescription="Encadrement scientifique"
    />
  )
}
