import Link from "next/link"
import {
  IconCalendarTime,
  IconUsers,
  IconSettings,
  IconFileDescription,
} from "@tabler/icons-react"

export default function Page() {
  const adminCards = [
    {
      title: "Délais & Échéances",
      description: "Définissez les délais pour chaque étape et suivez les rappels.",
      icon: IconCalendarTime,
      href: "/admin/delais",
    },
    {
      title: "Utilisateurs",
      description: "Gérez les comptes utilisateurs et les rôles.",
      icon: IconUsers,
      href: "/admin/utilisateurs",
    },
    {
      title: "Dossiers",
      description: "Consultez et gérez les dossiers de candidature.",
      icon: IconFileDescription,
      href: "/admin/dossiers",
    },
    {
      title: "Paramètres",
      description: "Configurez les paramètres du système.",
      icon: IconSettings,
      href: "/admin/parametres",
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Administration</h1>
        <p className="text-muted-foreground mt-1">
          Gérez les paramètres et fonctionnalités du système.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {adminCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-lg border bg-card p-6 transition-colors hover:bg-accent"
          >
            <card.icon className="size-8 text-primary" />
            <h3 className="mt-4 font-semibold">{card.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
