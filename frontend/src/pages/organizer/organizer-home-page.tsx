import { BarChart3, Calendar } from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"

export function OrganizerHomePage() {
  return (
    <DashboardLayout
      title="Painel do organizador"
      navItems={[
        { label: "Meus eventos", to: "/organizer", icon: Calendar },
        { label: "Vendas", to: "/organizer/vendas", icon: BarChart3 },
      ]}
    >
      <h1 className="font-heading text-2xl font-semibold">
        Painel do organizador
      </h1>
      <p className="mt-2 text-muted-foreground">
        Em construção — chega na Fase 2 do plano de implementação.
      </p>
    </DashboardLayout>
  )
}
