import { left, right, type Either } from '../../src/core/either.ts';
import { LineNotFoundError } from '../../src/domain/sequencing/application/usecases/errors/line-not-found-error.ts';
import { InvalidLineValuesError } from '../../src/domain/sequencing/enterprise/errors/invalid-line-values-error.ts';
import { ReportDocument } from '../../src/domain/sequencing/application/models/report-document.ts';
import {
  ReportDocumentEditor,
  type ReportLineChanges,
} from '../../src/domain/sequencing/application/services/report-document-editor.ts';
import {
  InMemoryReportDocument,
  readTestReportData,
} from './in-memory-report-document.ts';

export class InMemoryReportDocumentEditor extends ReportDocumentEditor {
  lineChanges: ReportLineChanges[] = [];
  updateMachine(
    content: ReportDocument,
    machineId: string | null,
  ): ReportDocument {
    return new InMemoryReportDocument({
      ...readTestReportData(content),
      machineId,
    });
  }
  updateLine(
    content: ReportDocument,
    changes: ReportLineChanges,
  ): Either<
    InvalidLineValuesError | LineNotFoundError,
    { content: ReportDocument }
  > {
    this.lineChanges.push(changes);
    return right({
      content: new InMemoryReportDocument({
        ...readTestReportData(content),
        edited: true,
      }),
    });
  }
  updateText(
    content: ReportDocument,
  ): Either<LineNotFoundError, { content: ReportDocument }> {
    return right({ content });
  }
  updateCompletion(
    content: ReportDocument,
    index: number,
    completed: boolean,
  ): Either<LineNotFoundError, { content: ReportDocument }> {
    const data = readTestReportData(content);
    const lines = data.linhas;
    if (
      !Array.isArray(lines) ||
      !lines[index] ||
      typeof lines[index] !== 'object' ||
      Array.isArray(lines[index])
    )
      return left(new LineNotFoundError());
    const updated = [...lines];
    updated[index] = {
      ...(lines[index] as Record<string, unknown>),
      concluida: completed,
    };
    return right({
      content: new InMemoryReportDocument({ ...data, linhas: updated }),
    });
  }
}
