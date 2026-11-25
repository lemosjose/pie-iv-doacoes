import { expect, test, type Page } from "@playwright/test"

const supplier = {
  id_usuario: 1,
  nome_razao: "Fornecedor Teste",
  tipo_perfil: "FORNECEDOR",
  documento: "12345678901",
}

const institution = {
  id_usuario: 2,
  nome_razao: "Instituição Teste",
  tipo_perfil: "INSTITUICAO",
  documento: "INST-TESTE-001",
}

const donation = {
  id_doacao: 3,
  descricao: "Cesta básica",
  id_fornecedor: 1,
  status: "DISPONIVEL",
  nome_fornecedor: "Fornecedor Teste",
  contato_fornecedor: {
    telefone: "34999990001",
    email: "fornecedor@teste.com",
  },
}

const accounts: Record<string, typeof supplier> = {
  "12345678901": supplier,
  "INST-TESTE-001": institution,
}

async function mockAuth(page: Page) {
  await page.route(
    (url) => url.pathname === "/api/usuarios/login",
    async (route) => {
      const body: unknown = route.request().postDataJSON()
      const documento =
        typeof body === "object" && body !== null && "documento" in body
          ? String(body.documento)
          : ""
      const usuario = accounts[documento]

      if (usuario === undefined) {
        await route.fulfill({
          status: 401,
          json: { detail: "Documento ou senha incorretos." },
        })
        return
      }

      await route.fulfill({
        json: {
          mensagem: "Login realizado com sucesso!",
          dados: {
            access_token: `token-${usuario.id_usuario}`,
            token_type: "bearer",
            usuario,
          },
        },
      })
    }
  )
}

async function login(page: Page, document: string) {
  await page.goto("/entrar")
  await page.getByLabel("CPF ou CNPJ").fill(document)
  await page.getByLabel("Senha").fill("senha123")
  await page.getByRole("button", { name: "Entrar" }).click()
}

test("instituição entra, vê a doação e agenda a retirada", async ({ page }) => {
  let scheduledBody: unknown = null
  let scheduledAuth: string | null = null

  await mockAuth(page)
  await page.route(
    (url) => url.pathname === "/api/doacoes",
    (route) => route.fulfill({ json: [donation] })
  )
  await page.route(
    (url) => url.pathname === "/api/doacoes/3",
    (route) => route.fulfill({ json: donation })
  )
  await page.route(
    (url) => url.pathname === "/api/agendamentos",
    async (route) => {
      scheduledBody = route.request().postDataJSON()
      scheduledAuth = await route.request().headerValue("authorization")
      await route.fulfill({
        status: 201,
        json: {
          mensagem: "Agendamento realizado com sucesso!",
          dados: {
            id_agendamento: 9,
            id_doacao: 3,
            id_instituicao: 2,
            data_retirada: "2099-01-10T14:00:00",
          },
        },
      })
    }
  )

  await login(page, "INST-TESTE-001")
  await expect(page).toHaveURL("/doacoes")

  const card = page.getByRole("listitem")
  await expect(card.getByText("Fornecedor Teste")).toBeVisible()
  await expect(
    card.getByRole("link", { name: "(34) 99999-0001" })
  ).toHaveAttribute("href", "tel:+5534999990001")
  await expect(
    card.getByRole("link", {
      name: "Conversar com Fornecedor Teste no WhatsApp",
    })
  ).toHaveAttribute("href", "https://wa.me/5534999990001")
  await expect(
    card.getByRole("link", { name: "fornecedor@teste.com" })
  ).toHaveAttribute("href", "mailto:fornecedor@teste.com")

  await page.getByRole("link", { name: "Ver detalhes de Cesta básica" }).click()
  await expect(
    page.getByRole("heading", { name: "Cesta básica" })
  ).toBeVisible()
  await expect(page.getByText("Fornecedor Teste")).toBeVisible()

  await page.getByRole("link", { name: "Agendar retirada" }).click()
  await expect(page).toHaveURL("/doacoes/3/agendamento")

  await page.getByLabel("Data e hora da retirada").fill("2099-01-10T14:00")
  await page.getByRole("button", { name: "Confirmar agendamento" }).click()

  await expect(page.getByRole("status")).toContainText("Retirada agendada")
  expect(scheduledBody).toEqual({
    id_doacao: 3,
    data_retirada: "2099-01-10T14:00",
  })
  expect(scheduledAuth).toBe("Bearer token-2")
})

test("visitante sem login não vê o contato do fornecedor", async ({ page }) => {
  await page.route(
    (url) => url.pathname === "/api/doacoes",
    (route) =>
      route.fulfill({ json: [{ ...donation, contato_fornecedor: null }] })
  )

  await page.goto("/doacoes")
  const card = page.getByRole("listitem")
  await expect(card.getByText("Fornecedor Teste")).toBeVisible()
  await expect(card.getByText("para ver o contato")).toBeVisible()
  await expect(card.getByRole("link", { name: /WhatsApp/ })).toBeHidden()
})

test("fornecedor publica uma nova doação", async ({ page }) => {
  let createdBody: unknown = null
  let createdAuth: string | null = null

  await mockAuth(page)
  await page.route(
    (url) => url.pathname === "/api/doacoes",
    async (route) => {
      createdBody = route.request().postDataJSON()
      createdAuth = await route.request().headerValue("authorization")
      await route.fulfill({
        status: 201,
        json: { mensagem: "Doação cadastrada com sucesso!", dados: donation },
      })
    }
  )

  await login(page, "123.456.789-01")
  await expect(page).toHaveURL("/doacoes/nova")

  await page.getByLabel("Descrição").fill("Cesta básica")
  await page.getByRole("button", { name: "Publicar doação" }).click()

  await expect(page.getByRole("status")).toHaveText(
    "Doação #3 publicada com sucesso."
  )
  expect(createdBody).toEqual({ descricao: "Cesta básica" })
  expect(createdAuth).toBe("Bearer token-1")
})

test("sessão expirada no servidor desloga o usuário", async ({ page }) => {
  await mockAuth(page)
  await page.route(
    (url) => url.pathname === "/api/doacoes",
    (route) => route.fulfill({ json: [] })
  )
  await page.route(
    (url) => url.pathname === "/api/agendamentos/2",
    (route) =>
      route.fulfill({
        status: 401,
        json: { detail: "Sessão inválida ou expirada. Entre novamente." },
      })
  )

  await login(page, "INST-TESTE-001")
  await expect(page).toHaveURL("/doacoes")
  await page.getByRole("link", { name: "Agendamentos" }).click()

  await expect(page.getByText("Entre com seu cadastro")).toBeVisible()
  await expect(page.getByRole("button", { name: "Sair" })).toBeHidden()
})

test("páginas restritas pedem login", async ({ page }) => {
  await page.goto("/doacoes/nova")
  await expect(page.getByText("Entre com seu cadastro")).toBeVisible()

  await page.goto("/agendamentos")
  await expect(page.getByText("Entre com seu cadastro")).toBeVisible()
})

test("login com credenciais erradas mostra o erro da API", async ({ page }) => {
  await mockAuth(page)
  await login(page, "00000000000")

  await expect(page.locator("main").getByRole("alert")).toHaveText(
    "Documento ou senha incorretos."
  )
})
