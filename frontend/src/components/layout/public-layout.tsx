import { Outlet } from "react-router-dom"

import { PublicNavbar } from "@/components/layout/public-navbar"

export function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
