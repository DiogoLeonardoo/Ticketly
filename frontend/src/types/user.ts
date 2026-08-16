export type Role = "USER" | "ORGANIZER" | "ADMIN"

/** Perfis que o próprio usuário pode escolher no cadastro — ADMIN é criado à parte. */
export type SelectableRole = Extract<Role, "USER" | "ORGANIZER">

export interface User {
  id: string
  name: string
  email: string
  city: string
  role: Role
}
