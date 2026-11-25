from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from auth import exigir_perfil, usuario_opcional
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/api/doacoes",
    tags=["Doações"]
)


def para_resposta(doacao: models.Doacao, usuario: models.Usuario | None) -> schemas.DoacaoResponse:
    return schemas.DoacaoResponse(
        id_doacao=doacao.id_doacao,
        descricao=doacao.descricao,
        id_fornecedor=doacao.id_fornecedor,
        status=doacao.status,
        nome_fornecedor=doacao.fornecedor.nome_razao,
        contato_fornecedor=(
            schemas.ContatoResponse.model_validate(doacao.fornecedor) if usuario else None
        ),
    )


# POST /api/doacoes: Cadastro de Doação no PostgreSQL
@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar uma nova doação vinculada a um fornecedor"
)
def cadastrar_doacao(
    doacao: schemas.Doacao,
    db: Session = Depends(get_db),
    fornecedor: models.Usuario = Depends(exigir_perfil("FORNECEDOR"))
):
    """
    Cadastra uma nova doação com status inicial 'DISPONIVEL' para o fornecedor autenticado.
    """
    nova_doacao = models.Doacao(
        descricao=doacao.descricao,
        id_fornecedor=fornecedor.id_usuario,
        status="DISPONIVEL"
    )

    db.add(nova_doacao)
    db.commit()
    db.refresh(nova_doacao)

    return {
        "mensagem": "Doação cadastrada com sucesso!",
        "dados": para_resposta(nova_doacao, fornecedor)
    }


# GET /api/doacoes: Listagem de Doações com Filtro 'DISPONIVEL'
@router.get(
    "",
    response_model=List[schemas.DoacaoResponse],
    summary="Listar doações disponíveis para retirada"
)
def listar_doacoes(
    apenas_disponiveis: bool = True,
    db: Session = Depends(get_db),
    usuario: models.Usuario | None = Depends(usuario_opcional)
):
    """
    Conforme o roteiro:
    Executa a query 'SELECT * FROM Doacoes WHERE status = 'DISPONIVEL'' para garantir
    que o front-end renderize no painel apenas os itens aguardando retirada.
    Se o parâmetro 'apenas_disponiveis=False' for passado, retorna todo o histórico.
    """
    query = db.query(models.Doacao).options(joinedload(models.Doacao.fornecedor))

    if apenas_disponiveis:
        query = query.filter(models.Doacao.status == "DISPONIVEL")

    return [para_resposta(doacao, usuario) for doacao in query.all()]


# GET /api/doacoes/{id_doacao}: Buscar doação por ID
@router.get(
    "/{id_doacao}",
    response_model=schemas.DoacaoResponse,
    summary="Buscar doação pelo ID"
)
def buscar_doacao(
    id_doacao: int,
    db: Session = Depends(get_db),
    usuario: models.Usuario | None = Depends(usuario_opcional)
):
    """
    Busca os detalhes de uma doação específica pelo seu identificador.
    """
    doacao = db.query(models.Doacao).filter(models.Doacao.id_doacao == id_doacao).first()
    if not doacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doação não encontrada."
        )
    return para_resposta(doacao, usuario)
