import { LegacyReportDocument } from '../../../pdf/legacy-report-document.ts';
import { describe, expect, it } from 'vitest';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.ts';
import { ReportSnapshot } from '../../../../domain/sequencing/application/models/report-snapshot.ts';
import { InvalidStoredReportError } from '../../../errors/invalid-stored-report-error.ts';
import { PrismaReportMapper } from './prisma-report-mapper.ts';

describe('PrismaRelatorioMapper', () => {
  it('preserva identidade, versão e conteúdo', () => {
    const original = ReportSnapshot.create(
      {
        version: 3,
        content: new LegacyReportDocument({ paginas: [{ texto: 'Olá' }] }),
      },
      new UniqueEntityID('relatorio-1'),
    );
    const restored = PrismaReportMapper.toDomain({
      id: original.id.toString(),
      version: original.version,
      content: JSON.parse(
        JSON.stringify(PrismaReportMapper.toPrisma(original)),
      ),
    });
    expect(restored.id.toString()).toBe('relatorio-1');
    expect(restored.version).toBe(3);
    expect(restored.content).toEqual(original.content);
  });

  it('rejeita conteúdo persistido com formato inválido', () => {
    expect(() =>
      PrismaReportMapper.toDomain({ id: '1', version: 1, content: [] }),
    ).toThrow(InvalidStoredReportError);
  });
});
