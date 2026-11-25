import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import models
from database import get_db

JWT_SECRET = os.environ["JWT_SECRET"]
if len(JWT_SECRET.encode()) < 32:
    raise RuntimeError("JWT_SECRET precisa ter pelo menos 32 bytes.")
JWT_ALGORITHM = "HS256"
TOKEN_TTL = timedelta(hours=8)

SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_DKLEN = 64

bearer = HTTPBearer(auto_error=False)


def _scrypt(senha: str, salt: bytes) -> bytes:
    return hashlib.scrypt(
        senha.encode(), salt=salt, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P, dklen=SCRYPT_DKLEN
    )


def hash_senha(senha: str) -> str:
    salt = secrets.token_bytes(16)
    return f"scrypt${salt.hex()}${_scrypt(senha, salt).hex()}"


def verificar_senha(senha: str, senha_hash: str) -> bool:
    try:
        algoritmo, salt_hex, hash_hex = senha_hash.split("$")
    except ValueError:
        return False
    if algoritmo != "scrypt":
        return False
    return hmac.compare_digest(_scrypt(senha, bytes.fromhex(salt_hex)).hex(), hash_hex)


def criar_token(usuario: models.Usuario) -> str:
    agora = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": str(usuario.id_usuario), "iat": agora, "exp": agora + TOKEN_TTL},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def usuario_opcional(
    credenciais: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> models.Usuario | None:
    if credenciais is None:
        return None
    try:
        return usuario_atual(credenciais, db)
    except HTTPException:
        return None


def usuario_atual(
    credenciais: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> models.Usuario:
    nao_autenticado = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sessão inválida ou expirada. Entre novamente.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credenciais is None:
        raise nao_autenticado

    try:
        payload = jwt.decode(credenciais.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        id_usuario = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise nao_autenticado

    usuario = db.get(models.Usuario, id_usuario)
    if usuario is None:
        raise nao_autenticado
    return usuario


def exigir_perfil(tipo_perfil: str):
    def dependencia(usuario: models.Usuario = Depends(usuario_atual)) -> models.Usuario:
        if usuario.tipo_perfil != tipo_perfil:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Ação permitida apenas para perfis {tipo_perfil}.",
            )
        return usuario

    return dependencia
