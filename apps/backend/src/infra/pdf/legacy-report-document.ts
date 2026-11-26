import { ReportDocument } from '../../domain/sequencing/application/models/report-document.ts';

export type LegacyReportValue =
  | string
  | number
  | boolean
  | null
  | LegacyReportValue[]
  | { [key: string]: LegacyReportValue };

export class LegacyReportDocument extends ReportDocument {
  constructor(readonly data: Record<string, LegacyReportValue>) {
    super();
  }

  static dataOf(document: ReportDocument): Record<string, LegacyReportValue> {
    if (!(document instanceof LegacyReportDocument))
      throw new Error('Unsupported report document format.');
    return document.data;
  }
}
