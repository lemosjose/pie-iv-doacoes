"use client"

import { useMemo, useSyncExternalStore } from "react"

import {
  parseStoredSession,
  readSession,
  subscribeSession,
} from "@/lib/session"
import type { CurrentUser } from "@/types/hooks"

function readServerSession(): string | null {
  return null
}

export function useCurrentUser(): CurrentUser {
  const raw = useSyncExternalStore(
    subscribeSession,
    readSession,
    readServerSession
  )
  const isHydrated = useSyncExternalStore(
    subscribeSession,
    () => true,
    () => false
  )
  const user = useMemo(() => parseStoredSession(raw)?.user ?? null, [raw])

  return { user, isHydrated }
}
