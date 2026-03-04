"use client"

import ActivityCategoryPage from "@/components/activity-category-page"

const SUBCATEGORIES = [
  "Conception et montage d'une filière accréditée comme coordonnateur",
  "Coordination d'une filière accréditée ou d'un établissement",
  "Préparation de cours ou TD ou TP d'un module nouveaux",
  "Préparation de supports et polycopiés de cours ou TD ou TP",
  "Participation aux travaux des jurys au niveau national",
  "Responsable d'un module",
]

export default function A1Page() {
  return (
    <ActivityCategoryPage
      type="enseignement"
      category="A/1"
      categoryTitle="A/1 - Enseignement et production pédagogique"
      subcategories={SUBCATEGORIES}
      draftKey="activites_ens_a1"
      backUrl="/candidat/candidature/pfe"
      nextUrl="/candidat/candidature/activites-enseignement/a2"
      stepTitle="Activités d'enseignement — A/1"
      stepDescription="Enseignement et production pédagogique"
    />
  )
}
