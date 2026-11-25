import type { Report } from '../../../domain/sequencing/enterprise/report.ts';

export class ReportPresenter {
  static toHTTP(report: Report) {
    const { pdfBase64: _sourcePdf, ...content } = report.content;

    return {
      id: report.id.toString(),
      versao: report.version,
      conteudo: content,
    };
  }
}
