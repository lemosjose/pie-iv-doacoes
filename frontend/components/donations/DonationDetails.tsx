"use client"

import Link from "next/link"
import { useCallback } from "react"

import { SupplierContact } from "@/components/donations/SupplierContact"
import { FormMessage } from "@/components/FormMessage"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useApiQuery } from "@/hooks/useApiQuery"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { statusLabel } from "@/lib/format"
import { getDonation } from "@/services/doacoes"
import type { DonationIdProps } from "@/types/components"

export function DonationDetails({ donationId }: DonationIdProps) {
  const { user } = useCurrentUser()
  const request = useCallback(
    (signal: AbortSignal) => getDonation(donationId, signal),
    [donationId]
  )
  const { data, error, isLoading } = useApiQuery(request)

  if (isLoading && data === null) {
    return <p className="text-sm text-muted-foreground">Carregando doação…</p>
  }

  if (error !== null || data === null) {
    return <FormMessage error={error ?? "Doação não encontrada."} />
  }

  const donation = data
  const canSchedule =
    donation.status === "DISPONIVEL" && user?.role === "INSTITUICAO"

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>{donation.description}</h1>
        </CardTitle>
        <CardDescription>Doação #{donation.id}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 text-xs">
          <dt className="text-muted-foreground">Situação</dt>
          <dd>{statusLabel(donation.status)}</dd>
        </dl>
        <SupplierContact
          name={donation.supplierName}
          contact={donation.supplierContact}
        />
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {canSchedule && (
          <Link
            href={`/doacoes/${donation.id}/agendamento`}
            className={buttonVariants()}
          >
            Agendar retirada
          </Link>
        )}
        {donation.status === "DISPONIVEL" && user === null && (
          <p className="text-xs text-muted-foreground">
            <Link href="/entrar" className="underline underline-offset-4">
              Entre
            </Link>{" "}
            como instituição para agendar a retirada.
          </p>
        )}
        <Link
          href="/doacoes"
          className={buttonVariants({ variant: "outline" })}
        >
          Voltar
        </Link>
      </CardFooter>
    </Card>
  )
}
