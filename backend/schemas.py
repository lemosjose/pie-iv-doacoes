import re
from datetime import datetime
from typing import Literal, Optional, Any, List
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def somente_digitos(valor: str) -> str:
    return re.sub(r"\D", "", valor)


def cpf_valido(cpf: str) -> bool:
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False
    for posicao in (9, 10):
        soma = sum(int(cpf[i]) * (posicao + 1 - i) for i in range(posicao))
        if soma * 10 % 11 % 10 != int(cpf[posicao]):
            return False
    return True


def cnpj_valido(cnpj: str) -> bool:
    if len(cnpj) != 14 or cnpj == cnpj[0] * 14:
        return False
    pesos = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    for pesos_digito in (pesos, [6, *pesos]):
        resto = sum(int(d) * p for d, p in zip(cnpj, pesos_digito)) % 11
        if (0 if resto < 2 else 11 - resto) != int(cnpj[len(pesos_digito)]):
            return False
    return True


# SCHEMAS DE ENTRADA

class Usuario(BaseModel):
    nome_razao: str = Field(min_length=3, max_length=100)
    tipo_perfil: Literal["FORNECEDOR", "INSTITUICAO"]
    documento: str = Field(min_length=11, max_length=20)
    senha: str = Field(min_length=8, max_length=128)
    telefone: str = Field(min_length=10, max_length=20)
    email: Optional[str] = Field(default=None, max_length=255)

    @field_validator("telefone")
    @classmethod
    def validar_telefone(cls, valor: str):
        digitos = somente_digitos(valor)
        if len(digitos) not in (10, 11):
            raise ValueError("Informe um telefone com DDD (10 ou 11 dígitos).")
        return digitos

    @field_validator("email")
    @classmethod
    def validar_email(cls, valor: Optional[str]):
        if valor is None or not valor.strip():
            return None
        valor = valor.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", valor):
            raise ValueError("Informe um e-mail válido.")
        return valor

    @field_validator("nome_razao")
    @classmethod
    def validar_nome(cls, valor: str):
        if not valor.strip():
            raise ValueError("O nome não pode ficar vazio")
        return valor.strip()

    @field_validator("documento")
    @classmethod
    def normalizar_documento(cls, valor: str):
        return somente_digitos(valor)

    @model_validator(mode="after")
    def validar_documento_por_perfil(self):
        if self.tipo_perfil == "INSTITUICAO" and not cnpj_valido(self.documento):
            raise ValueError("Instituições devem informar um CNPJ válido.")
        if self.tipo_perfil == "FORNECEDOR" and not (
            cpf_valido(self.documento) or cnpj_valido(self.documento)
        ):
            raise ValueError("Informe um CPF ou CNPJ válido.")
        return self


class Login(BaseModel):
    documento: str = Field(min_length=1, max_length=20)
    senha: str = Field(min_length=1, max_length=128)


class Doacao(BaseModel):
    descricao: str = Field(min_length=1, max_length=255)


class Agendamento(BaseModel):
    id_doacao: int = Field(gt=0)
    data_retirada: datetime


# SCHEMAS DE RESPOSTA DO BANCO DE DADOS

class UsuarioResponse(BaseModel):
    id_usuario: int
    nome_razao: str
    tipo_perfil: str
    documento: str

    model_config = ConfigDict(from_attributes=True)


class SessaoResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioResponse


class ContatoResponse(BaseModel):
    telefone: str
    email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DoacaoResponse(BaseModel):
    id_doacao: int
    descricao: str
    id_fornecedor: int
    status: str
    nome_fornecedor: str
    # Só vai para usuários autenticados: o GET de doações é público.
    contato_fornecedor: Optional[ContatoResponse] = None


class AgendamentoResponse(BaseModel):
    id_agendamento: int
    id_doacao: int
    id_instituicao: int
    data_retirada: datetime

    model_config = ConfigDict(from_attributes=True)


class AgendamentoDetalhadoResponse(BaseModel):
    id_agendamento: int
    id_doacao: int
    id_instituicao: int
    data_retirada: datetime
    descricao_doacao: Optional[str] = None
    status_doacao: Optional[str] = None
    nome_fornecedor: Optional[str] = None
    nome_instituicao: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Schema padrão para respostas envelopadas com mensagem (seguindo o padrão da colega)
class RespostaPadrao(BaseModel):
    mensagem: str
    dados: Any
