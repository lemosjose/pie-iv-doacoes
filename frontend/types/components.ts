import type { StaticImageData } from "next/image"
import type { ReactNode } from "react"

import type { Contact, User, UserRole } from "@/types/api"

export interface SignUpImage {
  src: StaticImageData
  alt: string
}

export type DocumentKind = "cpf" | "cnpj" | "cpfOrCnpj"

export interface SignUpCopy {
  nameLabel: string
  nameAutoComplete: string
  documentLabel: string
  documentPlaceholder: string
  documentKind: DocumentKind
  documentMaxLength: number
  documentError: string
}

export interface SignUpProps {
  role: UserRole
}

export interface SignUpPageProps extends SignUpProps {
  title: string
  description: string
}

export interface SignUpOption {
  href: string
  title: string
  description: string
  action: string
}

export interface FormMessageProps {
  error?: string | null
  success?: string | null
}

export interface RoleGateProps {
  role?: UserRole
  children: (user: User) => ReactNode
}

export interface SupplierContactProps {
  name: string
  contact: Contact | null
}

export interface DonationIdProps {
  donationId: number
}

export interface UserFormProps {
  user: User
}

export interface PageShellProps {
  title: string
  description?: string
  children: ReactNode
}
