import { LegacyReportDocument } from '../../pdf/legacy-report-document.ts';
import type { ReportSnapshot } from '../../../domain/sequencing/application/models/report-snapshot.ts';

export class ReportPresenter {
  static toHTTP(report: ReportSnapshot) {
    const { pdfBase64: _sourcePdf, ...content } = LegacyReportDocument.dataOf(
      report.content,
    );

    return {
      id: report.id.toString(),
      versao: report.version,
      conteudo: content,
    };
  }
}
