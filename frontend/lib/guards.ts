import type { User, UserRole } from "@/types/api"

const userRoles: readonly UserRole[] = ["FORNECEDOR", "INSTITUICAO"]

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isUserRole(value: unknown): value is UserRole {
  return userRoles.some((role) => role === value)
}

export function isUser(value: unknown): value is User {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    isUserRole(value.role) &&
    typeof value.document === "string"
  )
}
