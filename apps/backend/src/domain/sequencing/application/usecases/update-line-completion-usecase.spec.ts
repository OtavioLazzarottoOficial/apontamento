import { PdfReportDocumentEditor } from '../../../../infra/pdf/pdf-report-document-editor.ts';
import { PdfReportPageSummaryUpdater } from '../../../../infra/pdf/pdf-report-page-summary-updater.ts';
import { describe, expect, it } from 'vitest';
import { InMemoryReportsRepository } from '../../../../../test/repositories-in-memory/in-memory-reports-repository.ts';
import { Report } from '../../enterprise/report.ts';
import { UpdateReportUseCase } from './update-report-usecase.ts';
import { UpdateLineCompletionUseCase } from './update-line-completion-usecase.ts';
import { VersionConflictError } from './errors/version-conflict-error.ts';
import { LineNotFoundError } from './errors/line-not-found-error.ts';

describe('conclusão de uma ordem', () => {
  it('persiste, reabre e preserva os valores da linha', async () => {
    const repo = new InMemoryReportsRepository();
    const relatorio = Report.create({
      content: { linhas: [{ ordem: '123', realizada: 5 }] },
      version: 1,
    });
    repo.items.push(relatorio);
    const sut = new UpdateLineCompletionUseCase(
      repo,
      new UpdateReportUseCase(repo),
      new PdfReportDocumentEditor(new PdfReportPageSummaryUpdater()),
    );
    const request = {
      id: relatorio.id.toString(),
      indice: 0,
      versaoEsperada: 1,
      concluida: true,
    };
    expect((await sut.execute(request)).isRight()).toBe(true);
    expect(repo.items[0].content.linhas).toEqual([
      { ordem: '123', realizada: 5, concluida: true },
    ]);
    expect(
      (await sut.execute({ ...request, concluida: false })).value,
    ).toBeInstanceOf(VersionConflictError);
    expect(
      (
        await sut.execute({ ...request, versaoEsperada: 2, concluida: false })
      ).isRight(),
    ).toBe(true);
    expect(repo.items[0].content.linhas).toEqual([
      { ordem: '123', realizada: 5, concluida: false },
    ]);
    expect(
      (await sut.execute({ ...request, indice: 10, versaoEsperada: 3 })).value,
    ).toBeInstanceOf(LineNotFoundError);
  });
});
