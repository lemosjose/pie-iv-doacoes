import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { UserNav } from "@/components/user/UserNav"

export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-6 py-3">
      <Link href="/" className="text-sm font-medium">
        Início
      </Link>
      <nav aria-label="Principal" className="flex flex-wrap gap-2">
        <Link href="/doacoes" className={buttonVariants({ variant: "ghost" })}>
          Doações
        </Link>
        <UserNav />
      </nav>
    </header>
  )
}
