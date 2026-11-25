import { notFound } from "next/navigation"

import { DonationDetails } from "@/components/donations/DonationDetails"
import { parseId } from "@/lib/format"

export default async function Page({ params }: PageProps<"/doacoes/[id]">) {
  const donationId = parseId((await params).id)

  if (donationId === null) {
    notFound()
  }

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <DonationDetails donationId={donationId} />
    </main>
  )
}
