-- =====================================================================
-- pieiv_db — Script de inicialização (PostgreSQL 18)
-- Gerado a partir do dump em formato custom (pg_dump) enviado.
--
-- Uso:
--   1) Criar o banco (executar conectado a outro banco, ex.: postgres):
--        CREATE DATABASE pieiv_db WITH ENCODING = 'UTF8';
--   2) Conectar ao banco e rodar este script:
--        psql -U postgres -d pieiv_db -f pieiv_db_init.sql
-- =====================================================================

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

BEGIN;

-- ---------------------------------------------------------------------
-- Limpeza (permite reexecutar o script)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS public.agendamentos;
DROP TABLE IF EXISTS public.doacoes;
DROP TABLE IF EXISTS public.usuarios;

-- ---------------------------------------------------------------------
-- Tabela: usuarios
-- ---------------------------------------------------------------------
CREATE TABLE public.usuarios (
    id_usuario  SERIAL       PRIMARY KEY,
    nome_razao  VARCHAR(100) NOT NULL,
    tipo_perfil VARCHAR(20)  NOT NULL,
    documento   VARCHAR(20)  NOT NULL,
    senha_hash  VARCHAR(255) NOT NULL,
    telefone    VARCHAR(11)  NOT NULL,
    email       VARCHAR(255),
    CONSTRAINT usuarios_documento_key    UNIQUE (documento),
    CONSTRAINT usuarios_tipo_perfil_check
        CHECK (tipo_perfil IN ('FORNECEDOR', 'INSTITUICAO'))
);

-- ---------------------------------------------------------------------
-- Tabela: doacoes
-- ---------------------------------------------------------------------
CREATE TABLE public.doacoes (
    id_doacao     SERIAL       PRIMARY KEY,
    descricao     VARCHAR(255) NOT NULL,
    id_fornecedor INTEGER      NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'DISPONIVEL',
    CONSTRAINT fk_fornecedor
        FOREIGN KEY (id_fornecedor) REFERENCES public.usuarios (id_usuario)
);

-- ---------------------------------------------------------------------
-- Tabela: agendamentos
-- ---------------------------------------------------------------------
CREATE TABLE public.agendamentos (
    id_agendamento SERIAL    PRIMARY KEY,
    id_doacao      INTEGER   NOT NULL,
    id_instituicao INTEGER   NOT NULL,
    data_retirada  TIMESTAMP NOT NULL,
    CONSTRAINT fk_doacao
        FOREIGN KEY (id_doacao)      REFERENCES public.doacoes  (id_doacao),
    CONSTRAINT fk_instituicao
        FOREIGN KEY (id_instituicao) REFERENCES public.usuarios (id_usuario)
);

-- ---------------------------------------------------------------------
-- Dados iniciais
-- Senha dos dois usuários de teste: senha123
-- ---------------------------------------------------------------------
INSERT INTO public.usuarios (id_usuario, nome_razao, tipo_perfil, documento, senha_hash, telefone, email) VALUES
    (1, 'Fornecedor Teste', 'FORNECEDOR', '12345678901', 'scrypt$b4f639af3e506592ed5f22dcb9650c37$c3d244a9603e436ed0e853bb0934a425f1343a53abb7c31dfdeaf223b5f43d25e50e2cb934393d531da3e04951b250329f9fc65e79489ec27e978a0c208746a4', '34999990001', 'fornecedor@teste.com'),
    (2, 'Instituição Teste', 'INSTITUICAO', 'INST-TESTE-001', 'scrypt$b4f639af3e506592ed5f22dcb9650c37$c3d244a9603e436ed0e853bb0934a425f1343a53abb7c31dfdeaf223b5f43d25e50e2cb934393d531da3e04951b250329f9fc65e79489ec27e978a0c208746a4', '34999990002', NULL);

INSERT INTO public.doacoes (id_doacao, descricao, id_fornecedor, status) VALUES
    (1, 'Cesta básica para teste', 1, 'RESERVADO');

INSERT INTO public.agendamentos (id_agendamento, id_doacao, id_instituicao, data_retirada) VALUES
    (1, 1, 2, '2026-11-25 14:00:00');

-- ---------------------------------------------------------------------
-- Ajuste das sequences (após inserts com IDs explícitos)
-- ---------------------------------------------------------------------
SELECT setval('public.usuarios_id_usuario_seq',           2, true);
SELECT setval('public.doacoes_id_doacao_seq',             1, true);
SELECT setval('public.agendamentos_id_agendamento_seq',   1, true);

COMMIT;
