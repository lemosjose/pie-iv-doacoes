import { isRecord, isUser } from "@/lib/guards"
import type { Session } from "@/types/api"

const storageKey = "pieiv.session"
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

function isSession(value: unknown): value is Session {
  return (
    isRecord(value) && typeof value.token === "string" && isUser(value.user)
  )
}

export function parseStoredSession(raw: string | null): Session | null {
  if (raw === null) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    return isSession(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function readSession(): string | null {
  try {
    return window.localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

export function readToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  return parseStoredSession(readSession())?.token ?? null
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  window.addEventListener("storage", listener)

  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

export function saveSession(session: Session) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(session))
  } finally {
    notify()
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(storageKey)
  } finally {
    notify()
  }
}
