import type { AxiosResponse } from "axios"

import { api, parseEnvelope } from "@/lib/api"
import { onlyDigits } from "@/lib/document"
import { isRecord, isUserRole } from "@/lib/guards"
import type {
  CreateUserRequest,
  CreateUsuarioBody,
  LoginBody,
  LoginRequest,
  SessaoRow,
  Session,
  User,
  UsuarioRow,
} from "@/types/api"

function isUsuarioRow(value: unknown): value is UsuarioRow {
  return (
    isRecord(value) &&
    typeof value.id_usuario === "number" &&
    typeof value.nome_razao === "string" &&
    isUserRole(value.tipo_perfil) &&
    typeof value.documento === "string"
  )
}

function isSessaoRow(value: unknown): value is SessaoRow {
  return (
    isRecord(value) &&
    typeof value.access_token === "string" &&
    typeof value.token_type === "string" &&
    isUsuarioRow(value.usuario)
  )
}

function toUser(row: UsuarioRow): User {
  return {
    id: row.id_usuario,
    name: row.nome_razao,
    role: row.tipo_perfil,
    document: row.documento,
  }
}

function toSession(row: SessaoRow): Session {
  return { token: row.access_token, user: toUser(row.usuario) }
}

export async function createUser(request: CreateUserRequest): Promise<Session> {
  const body: CreateUsuarioBody = {
    nome_razao: request.name.trim(),
    tipo_perfil: request.role,
    documento: onlyDigits(request.document),
    senha: request.password,
    telefone: onlyDigits(request.phone),
    email: request.email.trim() || null,
  }

  const { data } = await api.post<
    unknown,
    AxiosResponse<unknown>,
    CreateUsuarioBody
  >("/api/usuarios", body)

  return toSession(parseEnvelope(data, isSessaoRow))
}

export async function login(request: LoginRequest): Promise<Session> {
  const document = request.document.trim()
  const body: LoginBody = {
    documento: /^[\d.\-/\s]+$/.test(document) ? onlyDigits(document) : document,
    senha: request.password,
  }

  const { data } = await api.post<unknown, AxiosResponse<unknown>, LoginBody>(
    "/api/usuarios/login",
    body
  )

  return toSession(parseEnvelope(data, isSessaoRow))
}
