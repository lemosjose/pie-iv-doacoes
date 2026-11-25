import Link from "next/link"

import { formatPhone, onlyDigits } from "@/lib/document"
import type { SupplierContactProps } from "@/types/components"

const linkClass = "underline underline-offset-4"

export function SupplierContact({ name, contact }: SupplierContactProps) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
      <dt className="text-muted-foreground">Fornecedor</dt>
      <dd>{name}</dd>
      {contact === null ? (
        <>
          <dt className="text-muted-foreground">Contato</dt>
          <dd>
            <Link href="/entrar" className={linkClass}>
              Entre
            </Link>{" "}
            para ver o contato.
          </dd>
        </>
      ) : (
        <>
          <dt className="text-muted-foreground">Telefone</dt>
          <dd className="flex flex-wrap gap-x-3">
            <a
              href={`tel:+55${onlyDigits(contact.phone)}`}
              className={linkClass}
            >
              {formatPhone(contact.phone)}
            </a>
            <a
              href={`https://wa.me/55${onlyDigits(contact.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
              aria-label={`Conversar com ${name} no WhatsApp`}
            >
              WhatsApp
            </a>
          </dd>
          {contact.email !== null && (
            <>
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="break-all">
                <a href={`mailto:${contact.email}`} className={linkClass}>
                  {contact.email}
                </a>
              </dd>
            </>
          )}
        </>
      )}
    </dl>
  )
}
