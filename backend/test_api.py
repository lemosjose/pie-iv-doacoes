import os
import tempfile
from pathlib import Path

banco = Path(tempfile.mkdtemp()) / "teste.db"
os.environ["DATABASE_URL"] = f"sqlite:///{banco}"
os.environ.setdefault("JWT_SECRET", "segredo-de-teste-com-pelo-menos-32-bytes")

from fastapi.testclient import TestClient

from main import app

cliente = TestClient(app)


def cadastrar(nome: str, perfil: str, documento: str) -> str:
    resposta = cliente.post(
        "/api/usuarios",
        json={
            "nome_razao": nome, "tipo_perfil": perfil, "documento": documento, "senha": "senha-forte",
            "telefone": "(34) 99999-0001", "email": " Contato@Mercado.com ",
        },
    )
    assert resposta.status_code == 201, resposta.text
    return resposta.json()["dados"]["access_token"]


def cabecalho(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_fluxo_completo():
    fornecedor = cadastrar("Mercado Bom Preço", "FORNECEDOR", "529.982.247-25")
    instituicao = cadastrar("Casa de Apoio", "INSTITUICAO", "11.222.333/0001-81")

    assert cliente.post("/api/usuarios", json={
        "nome_razao": "Duplicado", "tipo_perfil": "FORNECEDOR", "documento": "52998224725", "senha": "senha-forte",
        "telefone": "34999990001",
    }).status_code == 409

    def cadastro_status(perfil: str, documento: str, **extra: str) -> int:
        return cliente.post("/api/usuarios", json={
            "nome_razao": "Teste", "tipo_perfil": perfil, "documento": documento, "senha": "senha-forte",
            "telefone": "34999990001", **extra,
        }).status_code

    assert cadastro_status("FORNECEDOR", "39053344705", telefone="123") == 422
    assert cadastro_status("FORNECEDOR", "39053344705", email="sem-arroba") == 422

    assert cadastro_status("FORNECEDOR", "11111111111") == 422
    assert cadastro_status("FORNECEDOR", "529.982.247-26") == 422
    assert cadastro_status("INSTITUICAO", "123.456.789-09") == 422
    assert cadastro_status("INSTITUICAO", "11.222.333/0001-82") == 422

    assert cliente.post("/api/usuarios/login", json={"documento": "52998224725", "senha": "errada"}).status_code == 401
    login = cliente.post("/api/usuarios/login", json={"documento": "52998224725", "senha": "senha-forte"})
    assert login.status_code == 200
    assert login.json()["dados"]["usuario"]["nome_razao"] == "Mercado Bom Preço"
    assert "senha_hash" not in login.json()["dados"]["usuario"]
    assert login.json()["dados"]["usuario"]["documento"] == "52998224725"

    assert cliente.get("/api/usuarios/me").status_code == 401
    assert cliente.get("/api/usuarios/me", headers=cabecalho("token-falso")).status_code == 401
    assert cliente.get("/api/usuarios/me", headers=cabecalho(fornecedor)).json()["tipo_perfil"] == "FORNECEDOR"
    assert cliente.get("/api/usuarios").status_code == 401

    doacao = {"descricao": "20 kg de arroz"}
    assert cliente.post("/api/doacoes", json=doacao).status_code == 401
    assert cliente.post("/api/doacoes", json=doacao, headers=cabecalho(instituicao)).status_code == 403
    criada = cliente.post("/api/doacoes", json={**doacao, "id_fornecedor": 999}, headers=cabecalho(fornecedor))
    assert criada.status_code == 201
    id_doacao = criada.json()["dados"]["id_doacao"]
    id_fornecedor = criada.json()["dados"]["id_fornecedor"]
    assert id_fornecedor != 999

    publica = cliente.get("/api/doacoes").json()
    assert [d["id_doacao"] for d in publica] == [id_doacao]
    assert publica[0]["nome_fornecedor"] == "Mercado Bom Preço"
    assert publica[0]["contato_fornecedor"] is None
    autenticada = cliente.get(f"/api/doacoes/{id_doacao}", headers=cabecalho(instituicao)).json()
    assert autenticada["contato_fornecedor"] == {"telefone": "34999990001", "email": "contato@mercado.com"}

    agendamento = {"id_doacao": id_doacao, "data_retirada": "2099-01-10T14:00"}
    assert cliente.post("/api/agendamentos", json=agendamento, headers=cabecalho(fornecedor)).status_code == 403
    reservado = cliente.post("/api/agendamentos", json=agendamento, headers=cabecalho(instituicao))
    assert reservado.status_code == 201, reservado.text
    id_instituicao = reservado.json()["dados"]["id_instituicao"]
    assert cliente.post("/api/agendamentos", json=agendamento, headers=cabecalho(instituicao)).status_code == 409
    assert cliente.get("/api/doacoes").json() == []

    historico = cliente.get(f"/api/agendamentos/{id_instituicao}", headers=cabecalho(instituicao))
    assert historico.status_code == 200
    assert historico.json()[0]["nome_fornecedor"] == "Mercado Bom Preço"
    assert cliente.get(f"/api/agendamentos/{id_instituicao}", headers=cabecalho(fornecedor)).status_code == 403

    coletas = cliente.get(f"/api/agendamentos/{id_fornecedor}", headers=cabecalho(fornecedor))
    assert coletas.json()[0]["nome_instituicao"] == "Casa de Apoio"


if __name__ == "__main__":
    test_fluxo_completo()
    print("ok")
