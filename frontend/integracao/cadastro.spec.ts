import { expect, test } from "@playwright/test"

const forms = [
  {
    link: "Cadastrar instituição",
    url: "/instituicoes/cadastro",
    heading: "Cadastro de instituição",
    nameLabel: "Nome da instituição",
    documentLabel: "CNPJ",
    role: "INSTITUICAO",
    document: "11.222.333/0001-81",
    redirect: "/doacoes",
  },
  {
    link: "Cadastrar fornecedor",
    url: "/fornecedores/cadastro",
    heading: "Cadastro de fornecedor",
    nameLabel: "Nome ou razão social",
    documentLabel: "CPF ou CNPJ",
    role: "FORNECEDOR",
    document: "529.982.247-25",
    redirect: "/doacoes/nova",
  },
] as const

for (const form of forms) {
  test(`${form.heading} abre a partir da página inicial`, async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: form.link }).click()

    await expect(page).toHaveURL(form.url)
    await expect(
      page.getByRole("heading", { name: form.heading })
    ).toBeVisible()
    await expect(page.getByLabel(form.nameLabel)).toBeVisible()
    await expect(page.getByLabel(form.documentLabel)).toBeVisible()
    await expect(page.getByLabel("Senha")).toBeVisible()
  })

  test(`${form.heading} cria a conta e inicia a sessão`, async ({ page }) => {
    let sentBody: unknown = null

    await page.route(
      (url) => url.pathname === "/api/usuarios",
      async (route) => {
        sentBody = route.request().postDataJSON()
        await route.fulfill({
          status: 201,
          json: {
            mensagem: "Usuário cadastrado com sucesso!",
            dados: {
              access_token: "token-de-teste",
              token_type: "bearer",
              usuario: {
                id_usuario: 7,
                nome_razao: "Cadastro Teste",
                tipo_perfil: form.role,
                documento: form.document.replace(/\D/g, ""),
              },
            },
          },
        })
      }
    )
    await page.route(
      (url) => url.pathname === "/api/doacoes",
      (route) => route.fulfill({ json: [] })
    )

    await page.goto(form.url)
    await page.getByLabel(form.nameLabel).fill("Cadastro Teste")
    await page.getByLabel(form.documentLabel).fill("123")
    await page.getByLabel("Telefone / WhatsApp").fill("34999990001")
    await page.getByLabel("E-mail (opcional)").fill("contato@teste.com")
    await page.getByLabel("Senha").fill("senha-forte")
    await page.getByRole("button", { name: "Cadastrar" }).click()
    await expect(page.locator("main").getByRole("alert")).toBeVisible()

    await page.getByLabel(form.documentLabel).fill(form.document)
    await page.getByRole("button", { name: "Cadastrar" }).click()

    await expect(page).toHaveURL(form.redirect)
    await expect(page.getByText("Cadastro Teste ·")).toBeVisible()
    expect(sentBody).toEqual({
      nome_razao: "Cadastro Teste",
      tipo_perfil: form.role,
      documento: form.document.replace(/\D/g, ""),
      senha: "senha-forte",
      telefone: "34999990001",
      email: "contato@teste.com",
    })
  })
}

test("cadastro exige senha com pelo menos 8 caracteres", async ({ page }) => {
  await page.goto("/fornecedores/cadastro")
  await page.getByLabel("Nome ou razão social").fill("Fornecedor Teste")
  await page.getByLabel("CPF ou CNPJ").fill("52998224725")
  await page.getByLabel("Telefone / WhatsApp").fill("34999990001")
  await page.getByLabel("Senha").fill("curta")
  await page.getByRole("button", { name: "Cadastrar" }).click()

  await expect(page.locator("main").getByRole("alert")).toHaveText(
    "A senha deve ter pelo menos 8 caracteres."
  )
})

test("cadastro mostra o erro de documento duplicado vindo da API", async ({
  page,
}) => {
  await page.route(
    (url) => url.pathname === "/api/usuarios",
    (route) =>
      route.fulfill({
        status: 409,
        json: { detail: "Documento (CPF/CNPJ) já cadastrado no sistema." },
      })
  )

  await page.goto("/fornecedores/cadastro")
  await page.getByLabel("Nome ou razão social").fill("Fornecedor Teste")
  await page.getByLabel("CPF ou CNPJ").fill("52998224725")
  await page.getByLabel("Telefone / WhatsApp").fill("34999990001")
  await page.getByLabel("Senha").fill("senha-forte")
  await page.getByRole("button", { name: "Cadastrar" }).click()

  await expect(page.locator("main").getByRole("alert")).toHaveText(
    "Documento (CPF/CNPJ) já cadastrado no sistema."
  )
  await expect(page).toHaveURL("/fornecedores/cadastro")
})

test("CPF e CNPJ são formatados enquanto o usuário digita", async ({
  page,
}) => {
  await page.goto("/fornecedores/cadastro")
  const supplierDocument = page.getByLabel("CPF ou CNPJ")

  await supplierDocument.pressSequentially("52998224725")
  await expect(supplierDocument).toHaveValue("529.982.247-25")

  await supplierDocument.pressSequentially("123")
  await expect(supplierDocument).toHaveValue("52.998.224/7251-23")

  await page.goto("/instituicoes/cadastro")
  const institutionDocument = page.getByLabel("CNPJ")

  await institutionDocument.pressSequentially("11a222333000181999")
  await expect(institutionDocument).toHaveValue("11.222.333/0001-81")
})

test("cadastro rejeita CPF com dígito verificador errado", async ({ page }) => {
  await page.goto("/fornecedores/cadastro")
  await page.getByLabel("Nome ou razão social").fill("Fornecedor Teste")
  await page.getByLabel("CPF ou CNPJ").fill("529.982.247-26")
  await page.getByLabel("Senha").fill("senha-forte")
  await page.getByRole("button", { name: "Cadastrar" }).click()

  await expect(page.locator("main").getByRole("alert")).toHaveText(
    "Informe um CPF ou CNPJ válido."
  )
})
