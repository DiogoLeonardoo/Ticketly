import type { ComponentType, ReactNode } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import type { LucideProps } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface DashboardNavItem {
  label: string
  to: string
  icon: ComponentType<LucideProps>
}

interface DashboardLayoutProps {
  title: string
  navItems: DashboardNavItem[]
  children: ReactNode
}

export function DashboardLayout({ title, navItems, children }: DashboardLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate("/")
  }

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex flex-col gap-1 p-4">
          <span className="mb-4 px-2 font-heading text-lg font-semibold">
            Ticketly
          </span>
          <span className="px-2 pb-2 text-xs font-medium tracking-wide text-sidebar-foreground/60 uppercase">
            {title}
          </span>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-sidebar-border p-4">
          <span className="truncate text-sm font-medium">
            {user?.name ?? "—"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleLogout}
          >
            Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 bg-background p-8 text-foreground">{children}</main>
    </div>
  )
}
