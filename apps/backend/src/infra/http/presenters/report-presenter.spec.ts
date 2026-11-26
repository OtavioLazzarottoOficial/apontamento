import { LegacyReportDocument } from '../../pdf/legacy-report-document.ts';
import { describe, expect, it } from 'vitest';
import { UniqueEntityID } from '../../../core/entities/unique-entity-id.ts';
import { ReportSnapshot } from '../../../domain/sequencing/application/models/report-snapshot.ts';
import { ReportPresenter } from './report-presenter.ts';

describe('ReportPresenter', () => {
  it('preserves the existing HTTP contract without exposing the source PDF', () => {
    const report = ReportSnapshot.create(
      {
        content: new LegacyReportDocument({
          nome: 'Report',
          pdfBase64: 'private-source',
        }),
        version: 2,
      },
      new UniqueEntityID('report-id'),
    );
    expect(ReportPresenter.toHTTP(report)).toEqual({
      id: 'report-id',
      versao: 2,
      conteudo: { nome: 'Report' },
    });
  });
});
