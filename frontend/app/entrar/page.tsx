import { PageShell } from "@/components/PageShell"
import { Login } from "@/components/user/Login"

export default function Page() {
  return (
    <PageShell
      title="Entrar"
      description="Informe o CPF ou CNPJ usado no cadastro."
    >
      <Login />
    </PageShell>
  )
}
