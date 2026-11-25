import type { User } from "@/types/api"

export interface ApiMutation<TInput, TData> {
  data: TData | null
  error: string | null
  isLoading: boolean
  mutate: (input: TInput) => Promise<TData | null>
  reset: () => void
}

export interface ApiQuery<TData> {
  data: TData | null
  error: string | null
  isLoading: boolean
  refetch: () => void
}

export interface ApiQueryResult<TData> {
  request: (signal: AbortSignal) => Promise<TData>
  reloadToken: number
  data: TData | null
  error: string | null
}

export interface CurrentUser {
  user: User | null
  isHydrated: boolean
}
