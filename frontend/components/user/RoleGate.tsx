"use client"

import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { roleLabel } from "@/lib/format"
import type { RoleGateProps } from "@/types/components"

export function RoleGate({ role, children }: RoleGateProps) {
  const { user, isHydrated } = useCurrentUser()

  if (!isHydrated) {
    return null
  }

  if (user === null) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">
          Entre com seu cadastro para continuar.
        </p>
        <Link href="/entrar" className={buttonVariants()}>
          Entrar
        </Link>
      </div>
    )
  }

  if (role !== undefined && user.role !== role) {
    return (
      <p className="text-sm text-muted-foreground">
        Esta página é exclusiva para perfis do tipo {roleLabel(role)}.
      </p>
    )
  }

  return children(user)
}
