"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type SubmitEvent } from "react"

import { FormMessage } from "@/components/FormMessage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSignUp } from "@/hooks/useSignUp"
import {
  formatDocument,
  formatPhone,
  isValidCnpj,
  isValidCpf,
  isValidEmail,
  isValidPhone,
} from "@/lib/document"
import { formString, homePathFor } from "@/lib/format"
import { saveSession } from "@/lib/session"
import type { UserRole } from "@/types/api"
import type { SignUpCopy, SignUpProps } from "@/types/components"

const copy: Record<UserRole, SignUpCopy> = {
  INSTITUICAO: {
    nameLabel: "Nome da instituição",
    nameAutoComplete: "organization",
    documentLabel: "CNPJ",
    documentPlaceholder: "00.000.000/0000-00",
    documentKind: "cnpj",
    documentMaxLength: 18,
    documentError: "Informe um CNPJ válido.",
  },
  FORNECEDOR: {
    nameLabel: "Nome ou razão social",
    nameAutoComplete: "name",
    documentLabel: "CPF ou CNPJ",
    documentPlaceholder: "000.000.000-00",
    documentKind: "cpfOrCnpj",
    documentMaxLength: 18,
    documentError: "Informe um CPF ou CNPJ válido.",
  },
}

function isValidDocument(role: UserRole, document: string): boolean {
  return role === "INSTITUICAO"
    ? isValidCnpj(document)
    : isValidCpf(document) || isValidCnpj(document)
}

export function SignUp({ role }: SignUpProps) {
  const router = useRouter()
  const { mutate, error, isLoading } = useSignUp()
  const [document, setDocument] = useState("")
  const [phone, setPhone] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)
  const text = copy[role]

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = formString(form, "name").trim()
    const password = formString(form, "password")
    const email = formString(form, "email").trim()

    if (name.length < 3) {
      setValidationError("O nome deve ter pelo menos 3 caracteres.")
      return
    }

    if (!isValidDocument(role, document)) {
      setValidationError(text.documentError)
      return
    }

    if (!isValidPhone(phone)) {
      setValidationError("Informe um telefone com DDD.")
      return
    }

    if (email !== "" && !isValidEmail(email)) {
      setValidationError("Informe um e-mail válido.")
      return
    }

    if (password.length < 8) {
      setValidationError("A senha deve ter pelo menos 8 caracteres.")
      return
    }

    setValidationError(null)
    const session = await mutate({
      name,
      role,
      document,
      password,
      phone,
      email,
    })

    if (session !== null) {
      saveSession(session)
      router.push(homePathFor(session.user.role))
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{text.nameLabel}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete={text.nameAutoComplete}
          maxLength={100}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="document">{text.documentLabel}</Label>
        <Input
          id="document"
          name="document"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={text.documentPlaceholder}
          maxLength={text.documentMaxLength}
          value={document}
          onChange={(event) =>
            setDocument(formatDocument(event.target.value, text.documentKind))
          }
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Telefone / WhatsApp</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(34) 99999-0000"
          maxLength={15}
          value={phone}
          onChange={(event) => setPhone(formatPhone(event.target.value))}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail (opcional)</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={255}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
        />
      </div>
      <Button type="submit" size="lg" className="mt-2" disabled={isLoading}>
        {isLoading ? "Cadastrando…" : "Cadastrar"}
      </Button>
      <FormMessage error={validationError ?? error} />
      <p className="text-xs text-muted-foreground">
        Já tem cadastro?{" "}
        <Link href="/entrar" className="underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </form>
  )
}
