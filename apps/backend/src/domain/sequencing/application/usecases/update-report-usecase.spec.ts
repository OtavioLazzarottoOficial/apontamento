import { beforeEach, describe, expect, it } from 'vitest';
import { makeReport } from '../../../../../test/factories/make-report.ts';
import { InMemoryReportsRepository } from '../../../../../test/repositories-in-memory/in-memory-reports-repository.ts';
import { UpdateReportUseCase } from './update-report-usecase.ts';
import { VersionConflictError } from './errors/version-conflict-error.ts';
import { ReportNotFoundError } from './errors/report-not-found-error.ts';

describe('Atualizar relatório', () => {
  let repository: InMemoryReportsRepository;
  let sut: UpdateReportUseCase;

  beforeEach(() => {
    repository = new InMemoryReportsRepository();
    sut = new UpdateReportUseCase(repository);
  });

  it('salva a versão seguinte', async () => {
    const relatorio = makeReport({ version: 1 });
    repository.items.push(relatorio);
    const result = await sut.execute({
      id: relatorio.id.toString(),
      expectedVersion: 1,
      content: { nome: 'Atualizado' },
    });
    expect(result.isRight()).toBe(true);
    expect(repository.items[0].version).toBe(2);
    expect(repository.items[0].content).toEqual({ nome: 'Atualizado' });
  });

  it('recusa alteração baseada em versão antiga sem sobrescrever a atual', async () => {
    const relatorio = makeReport({ version: 2, content: { nome: 'Atual' } });
    repository.items.push(relatorio);
    const result = await sut.execute({
      id: relatorio.id.toString(),
      expectedVersion: 1,
      content: { nome: 'Antigo' },
    });
    expect(result.value).toBeInstanceOf(VersionConflictError);
    expect(repository.items[0].content).toEqual({ nome: 'Atual' });
  });

  it('recusa a gravação se ocorrer outra alteração depois da leitura', async () => {
    const relatorio = makeReport({ version: 1 });
    repository.items.push(relatorio);
    repository.updateIfVersionMatches = async () => false;
    const result = await sut.execute({
      id: relatorio.id.toString(),
      expectedVersion: 1,
      content: {},
    });
    expect(result.value).toBeInstanceOf(VersionConflictError);
    expect(repository.items[0]).toBe(relatorio);
  });

  it('informa quando o relatório não existe', async () => {
    const result = await sut.execute({
      id: 'ausente',
      expectedVersion: 1,
      content: {},
    });
    expect(result.value).toBeInstanceOf(ReportNotFoundError);
  });
});
