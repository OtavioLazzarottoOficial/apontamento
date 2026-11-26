import {
  InMemoryReportDocument,
  readTestReportData,
} from '../../../../../test/services-in-memory/in-memory-report-document.ts';
import { InMemoryReportDocumentEditor } from '../../../../../test/services-in-memory/in-memory-report-document-editor.ts';
import { describe, expect, it } from 'vitest';
import { InMemoryReportsRepository } from '../../../../../test/repositories-in-memory/in-memory-reports-repository.ts';
import { ReportSnapshot } from '../models/report-snapshot.ts';
import { UpdateReportUseCase } from './update-report-usecase.ts';
import { UpdateLineCompletionUseCase } from './update-line-completion-usecase.ts';
import { VersionConflictError } from './errors/version-conflict-error.ts';
import { LineNotFoundError } from './errors/line-not-found-error.ts';

describe('order completion', () => {
  it('persists completion, reopens and preserves line values', async () => {
    const repo = new InMemoryReportsRepository();
    const relatorio = ReportSnapshot.create({
      content: new InMemoryReportDocument({
        linhas: [{ ordem: '123', realizada: 5 }],
      }),
      version: 1,
    });
    repo.items.push(relatorio);
    const sut = new UpdateLineCompletionUseCase(
      repo,
      new UpdateReportUseCase(repo),
      new InMemoryReportDocumentEditor(),
    );
    const request = {
      id: relatorio.id.toString(),
      index: 0,
      expectedVersion: 1,
      completed: true,
    };
    expect((await sut.execute(request)).isRight()).toBe(true);
    expect(readTestReportData(repo.items[0].content).linhas).toEqual([
      { ordem: '123', realizada: 5, concluida: true },
    ]);
    expect(
      (await sut.execute({ ...request, completed: false })).value,
    ).toBeInstanceOf(VersionConflictError);
    expect(
      (
        await sut.execute({ ...request, expectedVersion: 2, completed: false })
      ).isRight(),
    ).toBe(true);
    expect(readTestReportData(repo.items[0].content).linhas).toEqual([
      { ordem: '123', realizada: 5, concluida: false },
    ]);
    expect(
      (await sut.execute({ ...request, index: 10, expectedVersion: 3 })).value,
    ).toBeInstanceOf(LineNotFoundError);
  });
});
