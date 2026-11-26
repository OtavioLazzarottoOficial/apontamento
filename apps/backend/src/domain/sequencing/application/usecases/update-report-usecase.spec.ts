import {
  InMemoryReportDocument,
  readTestReportData,
} from '../../../../../test/services-in-memory/in-memory-report-document.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeReport } from '../../../../../test/factories/make-report.ts';
import { InMemoryReportsRepository } from '../../../../../test/repositories-in-memory/in-memory-reports-repository.ts';
import { UpdateReportUseCase } from './update-report-usecase.ts';
import { VersionConflictError } from './errors/version-conflict-error.ts';
import { ReportNotFoundError } from './errors/report-not-found-error.ts';

describe('UpdateReportUseCase', () => {
  let repository: InMemoryReportsRepository;
  let sut: UpdateReportUseCase;

  beforeEach(() => {
    repository = new InMemoryReportsRepository();
    sut = new UpdateReportUseCase(repository);
  });

  it('saves the next version', async () => {
    const relatorio = makeReport({ version: 1 });
    repository.items.push(relatorio);
    const result = await sut.execute({
      id: relatorio.id.toString(),
      expectedVersion: 1,
      content: new InMemoryReportDocument({ nome: 'Atualizado' }),
    });
    expect(result.isRight()).toBe(true);
    expect(repository.items[0].version).toBe(2);
    expect(readTestReportData(repository.items[0].content)).toEqual({
      nome: 'Atualizado',
    });
  });

  it('rejects a stale version without overwriting current data', async () => {
    const relatorio = makeReport({
      version: 2,
      content: new InMemoryReportDocument({ nome: 'Atual' }),
    });
    repository.items.push(relatorio);
    const result = await sut.execute({
      id: relatorio.id.toString(),
      expectedVersion: 1,
      content: new InMemoryReportDocument({ nome: 'Antigo' }),
    });
    expect(result.value).toBeInstanceOf(VersionConflictError);
    expect(readTestReportData(repository.items[0].content)).toEqual({
      nome: 'Atual',
    });
  });

  it('rejects a concurrent update after reading', async () => {
    const relatorio = makeReport({ version: 1 });
    repository.items.push(relatorio);
    repository.updateIfVersionMatches = async () => false;
    const result = await sut.execute({
      id: relatorio.id.toString(),
      expectedVersion: 1,
      content: new InMemoryReportDocument({}),
    });
    expect(result.value).toBeInstanceOf(VersionConflictError);
    expect(repository.items[0]).toBe(relatorio);
  });

  it('reports when the document does not exist', async () => {
    const result = await sut.execute({
      id: 'ausente',
      expectedVersion: 1,
      content: new InMemoryReportDocument({}),
    });
    expect(result.value).toBeInstanceOf(ReportNotFoundError);
  });
});
