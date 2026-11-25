import { Injectable } from '@nestjs/common';
import {
  type ReportPage,
  type ReportSummary,
  type ReportSubtotalLine,
} from './report-page-types.ts';
import {
  updatePageSummaries,
  updatePageSubtotals,
} from './update-page-summaries.ts';

@Injectable()
export class PdfReportPageSummaryUpdater {
  updateSummaries(
    pages: ReportPage[],
    summaries: {
      porData: Record<string, ReportSummary>;
      porLote: Record<string, ReportSummary>;
      total: ReportSummary;
    },
  ) {
    updatePageSummaries(pages, summaries);
  }

  updateSubtotals(pages: ReportPage[], lines: ReportSubtotalLine[]) {
    updatePageSubtotals(pages, lines);
  }
}
