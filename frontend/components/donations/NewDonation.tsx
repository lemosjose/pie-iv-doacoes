"use client"

import Link from "next/link"
import type { SubmitEvent } from "react"

import { FormMessage } from "@/components/FormMessage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RoleGate } from "@/components/user/RoleGate"
import { useApiMutation } from "@/hooks/useApiMutation"
import { formString } from "@/lib/format"
import { createDonation } from "@/services/doacoes"

function NewDonationForm() {
  const { mutate, data, error, isLoading } = useApiMutation(createDonation)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const description = formString(new FormData(form), "description").trim()

    if (description === "") {
      return
    }

    const donation = await mutate({ description })

    if (donation !== null) {
      form.reset()
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          name="description"
          type="text"
          maxLength={255}
          placeholder="Ex.: 20 kg de arroz, validade 03/2027"
          required
        />
      </div>
      <Button type="submit" size="lg" disabled={isLoading}>
        {isLoading ? "Publicando…" : "Publicar doação"}
      </Button>
      <FormMessage
        error={error}
        success={
          data !== null ? `Doação #${data.id} publicada com sucesso.` : null
        }
      />
      {data !== null && (
        <Link
          href={`/doacoes/${data.id}`}
          className="text-xs underline underline-offset-4"
        >
          Ver doação publicada
        </Link>
      )}
    </form>
  )
}

export function NewDonation() {
  return <RoleGate role="FORNECEDOR">{() => <NewDonationForm />}</RoleGate>
}
