CREATE TABLE "configuracao_capacidade" (
  "id" INTEGER NOT NULL,
  "eficiencia_percentual" INTEGER NOT NULL DEFAULT 80,
  CONSTRAINT "configuracao_capacidade_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "configuracao_capacidade_singleton" CHECK ("id" = 1),
  CONSTRAINT "configuracao_capacidade_percentual_valido" CHECK ("eficiencia_percentual" BETWEEN 1 AND 100)
);
