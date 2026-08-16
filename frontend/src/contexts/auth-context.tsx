import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"

import type { User } from "@/types/user"

const STORAGE_KEY = "ticketly.auth"

interface StoredAuth {
  token: string
  user: User
}

interface AuthContextValue {
  user: User | null
  token: string | null
  login: (auth: StoredAuth) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredAuth
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(readStoredAuth)

  useEffect(() => {
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [auth])

  const value: AuthContextValue = {
    user: auth?.user ?? null,
    token: auth?.token ?? null,
    login: (nextAuth) => setAuth(nextAuth),
    logout: () => setAuth(null),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}
