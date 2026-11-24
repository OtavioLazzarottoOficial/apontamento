-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "relatorios_sequenciamento" (
    "id" TEXT NOT NULL,
    "conteudo" JSONB NOT NULL,
    "versao" INTEGER NOT NULL,

    CONSTRAINT "relatorios_sequenciamento_pkey" PRIMARY KEY ("id")
);
