"use client"

import Link from "next/link"

import { SupplierContact } from "@/components/donations/SupplierContact"
import { FormMessage } from "@/components/FormMessage"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { listDonations } from "@/services/doacoes"

function loadAvailableDonations(signal: AbortSignal) {
  return listDonations({ signal })
}

export function Donations() {
  const { user } = useCurrentUser()
  const { data, error, isLoading, refetch } = useApiQuery(
    loadAvailableDonations
  )

  return (
    <section className="flex flex-col gap-4" aria-busy={isLoading}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-medium">Doações disponíveis</h1>
        {user?.role === "FORNECEDOR" && (
          <Link href="/doacoes/nova" className={buttonVariants()}>
            Nova doação
          </Link>
        )}
      </div>
      {isLoading && data === null && (
        <p className="text-sm text-muted-foreground">Carregando doações…</p>
      )}
      {error !== null && (
        <div className="flex flex-col items-start gap-2">
          <FormMessage error={error} />
          <Button variant="outline" onClick={refetch}>
            Tentar novamente
          </Button>
        </div>
      )}
      {data !== null && data.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma doação disponível no momento.
        </p>
      )}
      {data !== null && data.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.map((donation) => (
            <li key={donation.id}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>
                    <h2>{donation.description}</h2>
                  </CardTitle>
                  <CardDescription>
                    Doação #{donation.id} · {statusLabel(donation.status)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SupplierContact
                    name={donation.supplierName}
                    contact={donation.supplierContact}
                  />
                </CardContent>
                <CardFooter className="mt-auto">
                  <Link
                    href={`/doacoes/${donation.id}`}
                    className={buttonVariants({ variant: "outline" })}
                    aria-label={`Ver detalhes de ${donation.description}`}
                  >
                    Ver detalhes
                  </Link>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
