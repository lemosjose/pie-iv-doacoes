from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth import criar_token, hash_senha, usuario_atual, verificar_senha
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/api/usuarios",
    tags=["Usuários"]
)


# POST /api/usuarios: Cadastro de Usuário no PostgreSQL
@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar um novo usuário (Fornecedor ou Instituição)"
)
def cadastrar_usuario(
    usuario: schemas.Usuario,
    db: Session = Depends(get_db)
):
    """
    Cadastra um novo usuário no banco de dados.
    Verifica se o CPF/CNPJ já existe antes de inserir para evitar erros de constraint UNIQUE,
    retornando HTTP 409 (Conflict) conforme especificado no roteiro.
    """
    # Consulta preventiva para checar se o documento já está cadastrado
    usuario_existente = db.query(models.Usuario).filter(
        models.Usuario.documento == usuario.documento
    ).first()

    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Documento (CPF/CNPJ) já cadastrado no sistema."
        )

    # Criação da entidade no PostgreSQL via SQLAlchemy
    novo_usuario = models.Usuario(
        nome_razao=usuario.nome_razao,
        tipo_perfil=usuario.tipo_perfil,
        documento=usuario.documento,
        senha_hash=hash_senha(usuario.senha),
        telefone=usuario.telefone,
        email=usuario.email
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return {
        "mensagem": "Usuário cadastrado com sucesso!",
        "dados": schemas.SessaoResponse(
            access_token=criar_token(novo_usuario),
            usuario=schemas.UsuarioResponse.model_validate(novo_usuario)
        )
    }


# POST /api/usuarios/login: Autenticação por documento e senha
@router.post(
    "/login",
    summary="Autenticar usuário e obter token de acesso"
)
def login(credenciais: schemas.Login, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(
        models.Usuario.documento == credenciais.documento
    ).first()

    if usuario is None or not verificar_senha(credenciais.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Documento ou senha incorretos."
        )

    return {
        "mensagem": "Login realizado com sucesso!",
        "dados": schemas.SessaoResponse(
            access_token=criar_token(usuario),
            usuario=schemas.UsuarioResponse.model_validate(usuario)
        )
    }


# GET /api/usuarios/me: Usuário autenticado
@router.get(
    "/me",
    response_model=schemas.UsuarioResponse,
    summary="Retornar o usuário dono do token"
)
def usuario_logado(usuario: models.Usuario = Depends(usuario_atual)):
    return usuario


# GET /api/usuarios: Listar todos os usuários cadastrados
@router.get(
    "",
    response_model=List[schemas.UsuarioResponse],
    summary="Listar todos os usuários"
)
def listar_usuarios(
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(usuario_atual)
):
    """
    Retorna a lista de todos os usuários do banco de dados (Fornecedores e Instituições).
    """
    usuarios = db.query(models.Usuario).all()
    return usuarios


# GET /api/usuarios/{id_usuario}: Buscar usuário por ID
@router.get(
    "/{id_usuario}",
    response_model=schemas.UsuarioResponse,
    summary="Buscar usuário pelo ID"
)
def buscar_usuario(id_usuario: int, db: Session = Depends(get_db)):
    """
    Busca os detalhes de um usuário específico pelo ID.
    Retorna 404 Not Found caso o usuário não exista.
    """
    usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado."
        )
    return usuario
