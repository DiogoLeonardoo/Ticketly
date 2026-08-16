import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { AuthBrandPanel } from "@/components/layout/auth-brand-panel"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { authService } from "@/services/auth-service"
import { ApiRequestError } from "@/services/http-client"
import type { SelectableRole } from "@/types/user"

export function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [city, setCity] = useState("")
  const [role, setRole] = useState<SelectableRole>("USER")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await authService.register({ name, email, password, city, role })
      const response = await authService.login({ email, password })
      login({ token: response.token, user: response.user })
      toast.success(`Conta criada! Bem-vindo(a), ${response.user.name}.`)
      navigate("/")
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Não foi possível criar a conta. Tente novamente."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-2">
      <AuthBrandPanel
        heading="Comece a vender ou comprar em minutos."
        description="Crie sua conta e escolha se quer garantir presença nos próximos eventos ou colocar o seu no ar."
      />

      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Criar sua conta</CardTitle>
            <CardDescription>
              Preencha os dados abaixo pra começar a usar o Ticketly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Nome completo</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="voce@exemplo.com"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Senha</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <FieldDescription>Mínimo de 8 caracteres.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="city">Cidade</FieldLabel>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Fortaleza"
                    required
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="role">Perfil</FieldLabel>
                  <Select
                    value={role}
                    onValueChange={(value) => setRole(value as SelectableRole)}
                  >
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">
                        Usuário — quero comprar ingressos
                      </SelectItem>
                      <SelectItem value="ORGANIZER">
                        Organizador — quero vender ingressos
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Define o que você vai poder fazer na plataforma.
                  </FieldDescription>
                </Field>
                <Field>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Criando conta..." : "Criar conta"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Já tem conta?{" "}
                    <Link to="/login" className="underline underline-offset-4">
                      Entrar
                    </Link>
                  </p>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
