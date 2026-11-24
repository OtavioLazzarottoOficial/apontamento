import { faker } from '@faker-js/faker';
import {
  Relatorio,
  type RelatorioProps,
} from '../../src/domain/sequenciamento/enterprise/relatorio.ts';
import type { UniqueEntityID } from '../../src/core/entities/unique-entity-id.ts';

export function makeRelatorio(
  overrides: Partial<RelatorioProps> = {},
  id?: UniqueEntityID,
) {
  return Relatorio.create(
    { conteudo: { nome: faker.lorem.words(2) }, versao: 1, ...overrides },
    id,
  );
}
