import type { DonationStatus, UserRole } from "@/types/api"

const statusLabels: Record<DonationStatus, string> = {
  DISPONIVEL: "Disponível",
  RESERVADO: "Reservado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
}

const roleLabels: Record<UserRole, string> = {
  FORNECEDOR: "Fornecedor",
  INSTITUICAO: "Instituição",
}

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

export function statusLabel(status: DonationStatus | null): string {
  return status === null ? "Sem status" : statusLabels[status]
}

export function roleLabel(role: UserRole): string {
  return roleLabels[role]
}

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}

export function homePathFor(role: UserRole): string {
  return role === "FORNECEDOR" ? "/doacoes/nova" : "/doacoes"
}

export function formString(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === "string" ? value : ""
}

export function parseId(value: string): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}
