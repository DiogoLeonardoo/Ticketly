const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export interface ApiError {
  code: string
  message: string
}

export class ApiRequestError extends Error {
  code: string

  constructor(apiError: ApiError) {
    super(apiError.message)
    this.code = apiError.code
  }
}

async function request<TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    const apiError: ApiError = await response
      .json()
      .catch(() => ({ code: "UNKNOWN_ERROR", message: "Erro inesperado ao falar com o servidor." }))
    throw new ApiRequestError(apiError)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return response.json() as Promise<TResponse>
}

export const httpClient = {
  post: <TResponse, TBody = unknown>(path: string, body: TBody) =>
    request<TResponse>(path, { method: "POST", body: JSON.stringify(body) }),
  get: <TResponse>(path: string, token?: string) =>
    request<TResponse>(path, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
}
