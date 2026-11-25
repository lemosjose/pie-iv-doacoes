"use client"

import Link from "next/link"
import { useCallback } from "react"

import { FormMessage } from "@/components/FormMessage"
import { Button } from "@/components/ui/button"
import { RoleGate } from "@/components/user/RoleGate"
import { useApiQuery } from "@/hooks/useApiQuery"
import { formatDateTime, statusLabel } from "@/lib/format"
import { listAppointmentsByUser } from "@/services/agendamentos"
import type { UserFormProps } from "@/types/components"

function AppointmentsTable({ user }: UserFormProps) {
  const request = useCallback(
    (signal: AbortSignal) => listAppointmentsByUser(user.id, signal),
    [user.id]
  )
  const { data, error, isLoading, refetch } = useApiQuery(request)
  const isInstitution = user.role === "INSTITUICAO"

  if (isLoading && data === null) {
    return (
      <p className="text-sm text-muted-foreground">Carregando agendamentos…</p>
    )
  }

  if (error !== null) {
    return (
      <div className="flex flex-col items-start gap-2">
        <FormMessage error={error} />
        <Button variant="outline" onClick={refetch}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (data === null || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {isInstitution ? (
          <>
            Você ainda não agendou retiradas.{" "}
            <Link href="/doacoes" className="underline underline-offset-4">
              Ver doações disponíveis
            </Link>
          </>
        ) : (
          "Nenhuma retirada agendada para suas doações."
        )}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-muted-foreground">
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pr-4 font-medium">
              Doação
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              {isInstitution ? "Fornecedor" : "Instituição"}
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Retirada
            </th>
            <th scope="col" className="py-2 font-medium">
              Situação
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((appointment) => (
            <tr key={appointment.id} className="border-b border-border">
              <td className="py-2 pr-4">
                <Link
                  href={`/doacoes/${appointment.donationId}`}
                  className="underline underline-offset-4"
                >
                  {appointment.donationDescription ??
                    `Doação #${appointment.donationId}`}
                </Link>
              </td>
              <td className="py-2 pr-4">
                {(isInstitution
                  ? appointment.supplierName
                  : appointment.institutionName) ?? "—"}
              </td>
              <td className="py-2 pr-4">
                {formatDateTime(appointment.pickupDate)}
              </td>
              <td className="py-2">
                {statusLabel(appointment.donationStatus)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Appointments() {
  return <RoleGate>{(user) => <AppointmentsTable user={user} />}</RoleGate>
}
