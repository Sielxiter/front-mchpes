"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconChecklist,
  IconFileText,
  IconInnerShadowTop,
  IconLayoutDashboard,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { ThemeToggle } from "@/components/theme-toggle"
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
} from "@/components/ui/sidebar"
import { logout, me } from "@/lib/auth"

const presidentNav = [
  {
    title: "Dashboard",
    url: "/president",
    icon: IconLayoutDashboard,
  },
  {
    title: "Dossiers",
    url: "/president",
    icon: IconFileText,
  },
  {
    title: "PV & validation",
    url: "/president/pv",
    icon: IconChecklist,
  },
]

export default function PresidentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = React.useState<{
    name: string
    email: string
    avatar: string
  } | null>(null)

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

  const handleLogout = async () => {
    await logout()
    window.location.href = "/login"
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
                <Link href="/president">
                  <IconInnerShadowTop className="size-5!" />
                  <span className="text-base font-semibold">Président</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={presidentNav} />
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
