"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type SubmitEvent } from "react"

import { FormMessage } from "@/components/FormMessage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApiMutation } from "@/hooks/useApiMutation"
import { formatDocument } from "@/lib/document"
import { formString, homePathFor } from "@/lib/format"
import { saveSession } from "@/lib/session"
import { login } from "@/services/usuarios"

export function Login() {
  const router = useRouter()
  const { mutate, error, isLoading } = useApiMutation(login)
  const [document, setDocument] = useState("")

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = formString(form, "password")

    if (document.trim() === "" || password === "") {
      return
    }

    const session = await mutate({ document, password })

    if (session !== null) {
      saveSession(session)
      router.push(homePathFor(session.user.role))
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="document">CPF ou CNPJ</Label>
        <Input
          id="document"
          name="document"
          type="text"
          autoComplete="username"
          placeholder="000.000.000-00"
          maxLength={20}
          value={document}
          onChange={(event) => {
            const { value } = event.target
            setDocument(
              /[a-z]/i.test(value) ? value : formatDocument(value, "cpfOrCnpj")
            )
          }}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <Button type="submit" size="lg" disabled={isLoading}>
        {isLoading ? "Entrando…" : "Entrar"}
      </Button>
      <FormMessage error={error} />
      <p className="text-xs text-muted-foreground">
        Ainda não tem cadastro?{" "}
        <Link href="/" className="underline underline-offset-4">
          Cadastre-se
        </Link>
      </p>
    </form>
  )
}
