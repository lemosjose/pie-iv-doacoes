import type { DocumentKind } from "@/types/components"

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "")
}

function formatCpf(digits: string): string {
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4")
}

function formatCnpj(digits: string): string {
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5")
}

export function formatDocument(value: string, kind: DocumentKind): string {
  const digits = onlyDigits(value).slice(0, 14)

  if (kind === "cnpj" || (kind === "cpfOrCnpj" && digits.length > 11)) {
    return formatCnpj(digits)
  }

  return formatCpf(digits.slice(0, 11))
}

export function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)
  const split = digits.length === 11 ? 7 : 6

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(new RegExp(`^(\\(\\d{2}\\) \\d{${split - 2}})(\\d)`), "$1-$2")
}

export function isValidPhone(value: string): boolean {
  return /^\d{10,11}$/.test(onlyDigits(value))
}

export function isValidEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value)

  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false
  }

  return [9, 10].every((position) => {
    let sum = 0
    for (let index = 0; index < position; index++) {
      sum += Number(cpf[index]) * (position + 1 - index)
    }
    return ((sum * 10) % 11) % 10 === Number(cpf[position])
  })
}

export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value)

  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) {
    return false
  }

  const weights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  return [weights, [6, ...weights]].every((digitWeights) => {
    const sum = digitWeights.reduce(
      (total, weight, index) => total + Number(cnpj[index]) * weight,
      0
    )
    const remainder = sum % 11
    const expected = remainder < 2 ? 0 : 11 - remainder
    return expected === Number(cnpj[digitWeights.length])
  })
}
