"use client"

import ActivityCategoryPage from "@/components/activity-category-page"

const SUBCATEGORIES = [
  "Participation à des projets de recherche financés (CNRST, International...)",
  "Création ou participation à la création d'une structure de recherche accréditée",
  "Communication orale ou poster dans un congrès",
]

export default function B3Page() {
  return (
    <ActivityCategoryPage
      type="recherche"
      category="B/3"
      categoryTitle="B/3 - Responsabilités scientifiques"
      subcategories={SUBCATEGORIES}
      draftKey="activites_rech_b3"
      backUrl="/candidat/candidature/activites-recherche/b2"
      nextUrl="/candidat/candidature/activites-recherche/b4"
      stepTitle="Activités de recherche — B/3"
      stepDescription="Responsabilités scientifiques"
    />
  )
}
