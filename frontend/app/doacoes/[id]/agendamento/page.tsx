import { notFound } from "next/navigation"

import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment"
import { PageShell } from "@/components/PageShell"
import { parseId } from "@/lib/format"

export default async function Page({
  params,
}: PageProps<"/doacoes/[id]/agendamento">) {
  const donationId = parseId((await params).id)

  if (donationId === null) {
    notFound()
  }

  return (
    <PageShell
      title="Agendar retirada"
      description={`Escolha quando retirar a doação #${donationId}.`}
    >
      <ScheduleAppointment donationId={donationId} />
    </PageShell>
  )
}
