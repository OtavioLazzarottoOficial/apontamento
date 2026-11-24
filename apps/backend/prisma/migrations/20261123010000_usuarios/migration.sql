CREATE TYPE "PapelUsuario" AS ENUM ('ADMINISTRADOR', 'USUARIO');
CREATE TABLE "usuarios" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "senha_hash" TEXT NOT NULL,
  "papel" "PapelUsuario" NOT NULL,
  "pode_editar" BOOLEAN NOT NULL DEFAULT false,
  "pode_exportar" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
