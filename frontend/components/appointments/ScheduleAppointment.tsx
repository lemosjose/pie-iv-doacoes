"use client"

import Link from "next/link"
import { useState, type SubmitEvent } from "react"

import { FormMessage } from "@/components/FormMessage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RoleGate } from "@/components/user/RoleGate"
import { useApiMutation } from "@/hooks/useApiMutation"
import { formatDateTime, formString } from "@/lib/format"
import { createAppointment } from "@/services/agendamentos"
import type { DonationIdProps } from "@/types/components"

function ScheduleAppointmentForm({ donationId }: DonationIdProps) {
  const { mutate, data, error, isLoading } = useApiMutation(createAppointment)
  const [validationError, setValidationError] = useState<string | null>(null)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const pickupDate = formString(
      new FormData(event.currentTarget),
      "pickupDate"
    )
    const pickupTime = Date.parse(pickupDate)

    if (Number.isNaN(pickupTime) || pickupTime <= Date.now()) {
      setValidationError("Escolha uma data e hora futuras para a retirada.")
      return
    }

    setValidationError(null)
    await mutate({ donationId, pickupDate })
  }

  if (data !== null) {
    return (
      <div className="flex flex-col items-start gap-3">
        <FormMessage
          success={`Retirada agendada para ${formatDateTime(data.pickupDate)}.`}
        />
        <Link
          href="/agendamentos"
          className="text-xs underline underline-offset-4"
        >
          Ver meus agendamentos
        </Link>
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pickupDate">Data e hora da retirada</Label>
        <Input
          id="pickupDate"
          name="pickupDate"
          type="datetime-local"
          required
        />
      </div>
      <Button type="submit" size="lg" disabled={isLoading}>
        {isLoading ? "Agendando…" : "Confirmar agendamento"}
      </Button>
      <FormMessage error={validationError ?? error} />
    </form>
  )
}

export function ScheduleAppointment({ donationId }: DonationIdProps) {
  return (
    <RoleGate role="INSTITUICAO">
      {() => <ScheduleAppointmentForm donationId={donationId} />}
    </RoleGate>
  )
}
