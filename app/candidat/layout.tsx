"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconCheck,
  IconCircle,
  IconFileDescription,
  IconHome,
  IconInnerShadowTop,
  IconLoader,
  IconSchool,
  IconBriefcase,
  IconFlask,
  IconClipboardCheck,
  IconUpload,
  IconChevronRight,
} from "@tabler/icons-react"

import { NavUser } from "@/components/nav-user"
import { ThemeToggle } from "@/components/theme-toggle"
import { logout, me } from "@/lib/auth"
import { candidatureApi, type CandidatureProgress } from "@/lib/api/candidature"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Collapsible } from "radix-ui"

interface SubStep {
  title: string
  url: string
}

interface CandidatureStep {
  id: number
  title: string
  description: string
  url: string
  icon: typeof IconFileDescription
  subSteps?: SubStep[]
}

const candidatureSteps: CandidatureStep[] = [
  {
    id: 1,
    title: "Profil",
    description: "Informations personnelles",
    url: "/candidat/candidature/profil",
    icon: IconFileDescription,
  },
  {
    id: 2,
    title: "Enseignements",
    description: "Responsabilités pédagogiques",
    url: "/candidat/candidature/enseignements",
    icon: IconSchool,
  },
  {
    id: 3,
    title: "PFE",
    description: "Encadrement des PFE",
    url: "/candidat/candidature/pfe",
    icon: IconBriefcase,
  },
  {
    id: 4,
    title: "Activités Enseignement",
    description: "A/1 – A/3",
    url: "/candidat/candidature/activites-enseignement",
    icon: IconSchool,
    subSteps: [
      { title: "A/1 — Production pédagogique", url: "/candidat/candidature/activites-enseignement/a1" },
      { title: "A/2 — Encadrement", url: "/candidat/candidature/activites-enseignement/a2" },
      { title: "A/3 — Responsabilités", url: "/candidat/candidature/activites-enseignement/a3" },
    ],
  },
  {
    id: 5,
    title: "Activités Recherche",
    description: "B/1 – B/4",
    url: "/candidat/candidature/activites-recherche",
    icon: IconFlask,
    subSteps: [
      { title: "B/1 — Production scientifique", url: "/candidat/candidature/activites-recherche/b1" },
      { title: "B/2 — Encadrement scientifique", url: "/candidat/candidature/activites-recherche/b2" },
      { title: "B/3 — Responsabilités scientifiques", url: "/candidat/candidature/activites-recherche/b3" },
      { title: "B/4 — Rayonnement & valorisation", url: "/candidat/candidature/activites-recherche/b4" },
    ],
  },
  {
    id: 6,
    title: "Validation",
    description: "Récapitulatif & soumission",
    url: "/candidat/candidature/validation",
    icon: IconClipboardCheck,
  },
]

export default function CandidatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [user, setUser] = React.useState<{
    name: string
    email: string
    avatar: string
  } | null>(null)
  const [progress, setProgress] = React.useState<CandidatureProgress | null>(null)

  React.useEffect(() => {
    let mounted = true
    me().then((u) => {
      if (mounted && u) {
        setUser({
          name: u.name,
          email: u.email,
          avatar: "",
        })
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  React.useEffect(() => {
    let mounted = true

    const loadProgress = async () => {
      try {
        const status = await candidatureApi.getStatus()
        if (!mounted) return
        setProgress(status.progress ?? null)
      } catch {
        if (!mounted) return
        setProgress(null)
      }
    }

    loadProgress()
    return () => {
      mounted = false
    }
  }, [pathname])

  const handleLogout = async () => {
    await logout()
    window.location.href = "/login"
  }

  const stepCompletion = progress?.steps ?? {}

  const getStepIcon = (step: CandidatureStep) => {
    const isActive = pathname.startsWith(step.url)
    const isCompleted = Boolean(stepCompletion[String(step.id)])

    if (isCompleted) {
      return <IconCheck className="size-4 text-green-600" />
    }

    if (isActive) {
      return <IconLoader className="size-4 animate-spin text-primary" />
    }

    return <IconCircle className="size-4 text-muted-foreground" />
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-1.5!"
              >
                <Link href="/candidat">
                  <IconInnerShadowTop className="size-5!" />
                  <span className="text-base font-semibold">Espace Candidat</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/candidat"}>
                    <Link href="/candidat">
                      <IconHome className="size-4" />
                      <span>Tableau de bord</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Dossier de candidature</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {candidatureSteps.map((step) => {
                  const isActive = pathname.startsWith(step.url)
                  const hasSubSteps = step.subSteps && step.subSteps.length > 0

                  if (hasSubSteps) {
                    return (
                      <Collapsible.Root
                        key={step.id}
                        defaultOpen={isActive}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <Collapsible.Trigger asChild>
                            <SidebarMenuButton
                              isActive={isActive}
                              className="justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <step.icon className="size-4" />
                                <span>{step.title}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {getStepIcon(step)}
                                <IconChevronRight className="size-3.5 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                              </div>
                            </SidebarMenuButton>
                          </Collapsible.Trigger>
                          <Collapsible.Content>
                            <SidebarMenuSub>
                              {step.subSteps!.map((sub) => (
                                <SidebarMenuSubItem key={sub.url}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={pathname === sub.url}
                                  >
                                    <Link href={sub.url}>
                                      <span>{sub.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </Collapsible.Content>
                        </SidebarMenuItem>
                      </Collapsible.Root>
                    )
                  }

                  return (
                    <SidebarMenuItem key={step.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="justify-between"
                      >
                        <Link href={step.url}>
                          <div className="flex items-center gap-2">
                            <step.icon className="size-4" />
                            <span>{step.title}</span>
                          </div>
                          {getStepIcon(step)}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Documents</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/candidat/documents"}>
                    <Link href="/candidat/documents">
                      <IconUpload className="size-4" />
                      <span>Mes documents</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {user && <NavUser user={user} onLogout={handleLogout} />}
        </SidebarFooter>
      </Sidebar>
      <main className="flex flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </SidebarProvider>
  )
}
