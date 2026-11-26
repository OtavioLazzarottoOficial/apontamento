import { ReportDocument } from '../../src/domain/sequencing/application/models/report-document.ts';

export class InMemoryReportDocument extends ReportDocument {
  constructor(readonly data: Record<string, unknown>) {
    super();
  }
}

export function readTestReportData(
  document: ReportDocument,
): Record<string, unknown> {
  if (
    !('data' in document) ||
    typeof document.data !== 'object' ||
    document.data === null ||
    Array.isArray(document.data)
  )
    throw new Error('Unsupported test document.');
  return document.data as Record<string, unknown>;
}
