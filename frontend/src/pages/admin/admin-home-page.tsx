import { ShieldCheck, Users } from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"

export function AdminHomePage() {
  return (
    <DashboardLayout
      title="Painel do admin"
      navItems={[
        { label: "Aprovação de eventos", to: "/admin", icon: ShieldCheck },
        { label: "Usuários", to: "/admin/usuarios", icon: Users },
      ]}
    >
      <h1 className="font-heading text-2xl font-semibold">Painel do admin</h1>
      <p className="mt-2 text-muted-foreground">
        Em construção — chega na Fase 2 do plano de implementação.
      </p>
    </DashboardLayout>
  )
}
