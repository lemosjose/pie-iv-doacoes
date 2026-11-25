import type { AxiosResponse } from "axios"

import { api, isArrayOf, parseBody, parseEnvelope } from "@/lib/api"
import { isRecord } from "@/lib/guards"
import type {
  ContatoRow,
  CreateDoacaoBody,
  CreateDonationRequest,
  DoacaoRow,
  Donation,
  DonationStatus,
  ListDonationsOptions,
} from "@/types/api"

const donationStatuses: readonly DonationStatus[] = [
  "DISPONIVEL",
  "RESERVADO",
  "CONCLUIDO",
  "CANCELADO",
]

export function isDonationStatus(value: unknown): value is DonationStatus {
  return donationStatuses.some((status) => status === value)
}

function isContatoRow(value: unknown): value is ContatoRow {
  return (
    isRecord(value) &&
    typeof value.telefone === "string" &&
    (value.email === null || typeof value.email === "string")
  )
}

function isDoacaoRow(value: unknown): value is DoacaoRow {
  return (
    isRecord(value) &&
    typeof value.id_doacao === "number" &&
    typeof value.descricao === "string" &&
    typeof value.id_fornecedor === "number" &&
    isDonationStatus(value.status) &&
    typeof value.nome_fornecedor === "string" &&
    (value.contato_fornecedor === null ||
      isContatoRow(value.contato_fornecedor))
  )
}

function toDonation(row: DoacaoRow): Donation {
  const contact = row.contato_fornecedor

  return {
    id: row.id_doacao,
    description: row.descricao,
    supplierId: row.id_fornecedor,
    status: row.status,
    supplierName: row.nome_fornecedor,
    supplierContact:
      contact === null
        ? null
        : { phone: contact.telefone, email: contact.email },
  }
}

export async function createDonation(
  request: CreateDonationRequest
): Promise<Donation> {
  const body: CreateDoacaoBody = {
    descricao: request.description.trim(),
  }

  const { data } = await api.post<
    unknown,
    AxiosResponse<unknown>,
    CreateDoacaoBody
  >("/api/doacoes", body)

  return toDonation(parseEnvelope(data, isDoacaoRow))
}

export async function listDonations({
  onlyAvailable = true,
  signal,
}: ListDonationsOptions = {}): Promise<readonly Donation[]> {
  const { data } = await api.get<unknown>("/api/doacoes", {
    params: { apenas_disponiveis: onlyAvailable },
    signal,
  })

  return parseBody(data, isArrayOf(isDoacaoRow)).map(toDonation)
}

export async function getDonation(
  id: number,
  signal?: AbortSignal
): Promise<Donation> {
  const { data } = await api.get<unknown>(`/api/doacoes/${id}`, { signal })

  return toDonation(parseBody(data, isDoacaoRow))
}
