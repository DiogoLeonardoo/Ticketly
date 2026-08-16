import { httpClient } from "@/services/http-client"
import type { SelectableRole, User } from "@/types/user"

export interface RegisterRequest {
  name: string
  email: string
  password: string
  city: string
  role: SelectableRole
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  tokenType: string
  expiresInSeconds: number
  user: User
}

export const authService = {
  register: (data: RegisterRequest) =>
    httpClient.post<User, RegisterRequest>("/auth/register", data),
  login: (data: LoginRequest) =>
    httpClient.post<AuthResponse, LoginRequest>("/auth/login", data),
}
