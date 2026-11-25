# Back-end FastAPI - Plataforma de doações (PIE IV)

Este repositório contém a API REST desenvolvida em **FastAPI** e **SQLAlchemy**, integrada ao banco de dados **PostgreSQL**, estruturada para alimentar a interface em **Next.js**.

---

## Estrutura de arquivos

```text
backend/
├── main.py              # Ponto de inicialização do FastAPI, CORS e inclusão de rotas
├── database.py          # Conexão com o PostgreSQL e injeção de dependência de sessão
├── models.py            # Modelos relacionais do SQLAlchemy (Usuarios, Doacoes, Agendamentos)
├── schemas.py           # Validações de entrada Pydantic e modelos de resposta
├── routers/
│   ├── __init__.py
│   ├── usuarios.py      # POST /api/usuarios, GET /api/usuarios e busca por ID
│   ├── doacoes.py       # POST e GET /api/doacoes (filtro de disponíveis)
│   └── agendamentos.py  # POST (Transação SQL) e GET /api/agendamentos/{id_usuario} (JOIN)
├── auth.py              # Hash de senha (scrypt), tokens JWT e checagem de perfil
├── test_api.py          # Teste do fluxo completo e das regras de acesso (SQLite)
├── pyproject.toml       # Dependências do Python (gerenciadas pelo uv)
├── uv.lock              # Versões travadas — não editar à mão
└── .env.example         # Exemplo de variáveis de ambiente do banco
```

---

## Como instalar e rodar o projeto

### 1. Instalar as dependências com o [uv](https://docs.astral.sh/uv/)
```bash
cd backend
uv sync
```
O `uv sync` cria o `.venv` com as versões exatas do `uv.lock`. Para adicionar uma
dependência use `uv add <pacote>` (nunca `pip install`), e faça commit do `pyproject.toml`
e do `uv.lock` juntos.

### 2. Configurar o Banco de Dados
Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```
Ajuste a variável `DATABASE_URL` (e defina um `JWT_SECRET` longo e aleatório) com as suas credenciais do PostgreSQL:
```env
DATABASE_URL=postgresql+psycopg://seu_usuario:sua_senha@localhost:5432/nome_do_banco
```

### 3. Executar a Aplicação
```bash
uv run uvicorn main:app --reload --port 8000
```
- A documentação interativa Swagger estará disponível em: **http://localhost:8000/docs**
- O front-end Next.js rodando em **http://localhost:3000** já possui permissão de acesso via CORS.

Para testar autenticação e o fluxo completo sem PostgreSQL: `uv run python test_api.py`.

---

## Resumo das rotas e regras de negócio

| Método | Endpoint | Descrição / Regra de Negócio |
| :--- | :--- | :--- |
| `POST` | `/api/usuarios` | Valida dados e verifica duplicidade de documento (`documento UNIQUE`), retornando `HTTP 409 Conflict` se já existir. Salva a senha com hash scrypt e devolve um token JWT. |
| `POST` | `/api/usuarios/login` | Autentica com `documento` + `senha` e devolve um token JWT (8 h). |
| `GET` | `/api/usuarios/me` | Usuário dono do token. |
| `GET` | `/api/usuarios` | Lista todos os usuários cadastrados no banco de dados. |
| `GET` | `/api/usuarios/{id_usuario}` | Consulta um usuário específico pelo ID. Retorna `HTTP 404` se não existir. |
| `POST` | `/api/doacoes` | Exige token de `FORNECEDOR`; o fornecedor vem do token. Cria o item com status inicial `DISPONIVEL`. |
| `GET` | `/api/doacoes` | Retorna as doações com filtro padrão `status = 'DISPONIVEL'` para exibição no painel de retirada. |
| `POST` | `/api/agendamentos` | **Transação SQL ACID**: Exige token de `INSTITUICAO` (a instituição vem do token); trava a doação com `FOR UPDATE` e valida se está `DISPONIVEL`. Insere o agendamento e atualiza a doação para `RESERVADO`. Executa `commit` ou `rollback` em caso de erro. |
| `GET` | `/api/agendamentos` | Lista geral de todos os agendamentos registrados. |
| `GET` | `/api/agendamentos/{id_usuario}` | Exige token do próprio usuário (senão `403`). Realiza `JOIN` condicional: lista reservas ativas se o usuário for `INSTITUICAO` ou coletas agendadas se for `FORNECEDOR`. |
