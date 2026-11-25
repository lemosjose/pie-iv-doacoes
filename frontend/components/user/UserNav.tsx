"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button, buttonVariants } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { roleLabel } from "@/lib/format"
import { clearSession } from "@/lib/session"

export function UserNav() {
  const router = useRouter()
  const { user, isHydrated } = useCurrentUser()

  if (!isHydrated) {
    return null
  }

  if (user === null) {
    return (
      <>
        <Link
          href="/instituicoes/cadastro"
          className={buttonVariants({ variant: "ghost" })}
        >
          Sou instituição
        </Link>
        <Link
          href="/fornecedores/cadastro"
          className={buttonVariants({ variant: "ghost" })}
        >
          Sou fornecedor
        </Link>
        <Link href="/entrar" className={buttonVariants({ variant: "outline" })}>
          Entrar
        </Link>
      </>
    )
  }

  return (
    <>
      {user.role === "FORNECEDOR" && (
        <Link
          href="/doacoes/nova"
          className={buttonVariants({ variant: "ghost" })}
        >
          Nova doação
        </Link>
      )}
      <Link
        href="/agendamentos"
        className={buttonVariants({ variant: "ghost" })}
      >
        Agendamentos
      </Link>
      <span className="self-center text-xs text-muted-foreground">
        {user.name} · {roleLabel(user.role)}
      </span>
      <Button
        variant="outline"
        onClick={() => {
          clearSession()
          router.push("/")
        }}
      >
        Sair
      </Button>
    </>
  )
}
