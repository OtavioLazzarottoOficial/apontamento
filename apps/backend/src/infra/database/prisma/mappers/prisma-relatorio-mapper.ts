import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.ts';
import {
  Relatorio,
  type ValorRelatorio,
} from '../../../../domain/sequenciamento/enterprise/relatorio.ts';
import { DadosRelatorioInvalidosError } from '../../../errors/dados-relatorio-invalidos-error.ts';
import type { Prisma, RelatorioSequenciamento } from '../generated/client.ts';

export class PrismaRelatorioMapper {
  static toDomain(raw: RelatorioSequenciamento): Relatorio {
    if (
      raw.conteudo === null ||
      Array.isArray(raw.conteudo) ||
      typeof raw.conteudo !== 'object' ||
      !Number.isInteger(raw.versao) ||
      raw.versao < 1
    ) {
      throw new DadosRelatorioInvalidosError();
    }

    return Relatorio.create(
      {
        conteudo: raw.conteudo as { [key: string]: ValorRelatorio },
        versao: raw.versao,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(relatorio: Relatorio): Prisma.InputJsonObject {
    return relatorio.conteudo as Prisma.InputJsonObject;
  }
}
