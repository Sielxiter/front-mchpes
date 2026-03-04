"use client"

import ActivityCategoryPage from "@/components/activity-category-page"

const SUBCATEGORIES = [
  "Responsabilité de structure de recherche accréditée comme directeur",
  "Responsabilité de structure de recherche accréditée comme chef d'équipe",
  "Rédaction de rapports d'expertise ou de rapports techniques",
  "Évaluation d'articles scientifiques (reviewer)",
]

export default function B4Page() {
  return (
    <ActivityCategoryPage
      type="recherche"
      category="B/4"
      categoryTitle="B/4 - Rayonnement, innovation et valorisation"
      subcategories={SUBCATEGORIES}
      draftKey="activites_rech_b4"
      backUrl="/candidat/candidature/activites-recherche/b3"
      nextUrl="/candidat/candidature/validation"
      stepTitle="Activités de recherche — B/4"
      stepDescription="Rayonnement, innovation et valorisation"
    />
  )
}
