import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

export function PublicNavbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          to="/"
          className="font-heading text-lg font-semibold text-secondary-foreground"
        >
          Ticketly
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-foreground">
            Eventos
          </Link>
        </nav>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Olá, {user.name.split(" ")[0]}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link to="/cadastro">Criar conta</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
