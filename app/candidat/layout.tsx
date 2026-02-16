"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

const candidatureSteps = [
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
  },
  {
    id: 5,
    title: "Activités Recherche",
    description: "B/1 – B/4",
    url: "/candidat/candidature/activites-recherche",
    icon: IconFlask,
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
  const router = useRouter()
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

  const requiredStepIds = [1, 2, 3, 4, 5]
  const stepCompletion = progress?.steps ?? {}

  const getStepTitleById = (id: number) => candidatureSteps.find((s) => s.id === id)?.title ?? `Étape ${id}`

  const guardedNavigate = (targetUrl: string) => {
    const targetStep = candidatureSteps.find((s) => s.url === targetUrl)
    const currentStep = candidatureSteps.find((s) => pathname.startsWith(s.url))

    if (!targetStep) {
      router.push(targetUrl)
      return
    }

    // Always allow going backwards.
    if (currentStep && targetStep.id <= currentStep.id) {
      router.push(targetUrl)
      return
    }

    const missing = requiredStepIds
      .filter((id) => id < targetStep.id)
      .filter((id) => !stepCompletion[String(id)])

    if (missing.length === 0) {
      router.push(targetUrl)
      return
    }

    window.alert(
      `Votre dossier est incomplet. Veuillez terminer d'abord: ${missing
        .map(getStepTitleById)
        .join(", ")}.`
    )
  }

  const getStepIcon = (step: typeof candidatureSteps[0]) => {
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
                {candidatureSteps.map((step) => (
                  <SidebarMenuItem key={step.id}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname.startsWith(step.url)}
                      className="justify-between"
                    >
                      <Link
                        href={step.url}
                        onClick={(e) => {
                          e.preventDefault()
                          guardedNavigate(step.url)
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <step.icon className="size-4" />
                          <span>{step.title}</span>
                        </div>
                        {getStepIcon(step)}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
