import { NewDonation } from "@/components/donations/NewDonation"
import { PageShell } from "@/components/PageShell"

export default function Page() {
  return (
    <PageShell
      title="Nova doação"
      description="Descreva o lote que você quer doar."
    >
      <NewDonation />
    </PageShell>
  )
}
