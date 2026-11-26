import {
  InMemoryReportDocument,
  readTestReportData,
} from '../../../../../test/services-in-memory/in-memory-report-document.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryReportsRepository } from '../../../../../test/repositories-in-memory/in-memory-reports-repository.ts';
import { InMemoryReportDocumentEditor } from '../../../../../test/services-in-memory/in-memory-report-document-editor.ts';
import { ReportSnapshot } from '../models/report-snapshot.ts';
import { UpdateReportUseCase } from './update-report-usecase.ts';
import { UpdateReportLineUseCase } from './update-report-line-usecase.ts';
import { InvalidLineValuesError } from '../../enterprise/errors/invalid-line-values-error.ts';
import { VersionConflictError } from './errors/version-conflict-error.ts';

describe('UpdateReportLineUseCase', () => {
  let reports: InMemoryReportsRepository;
  let editor: InMemoryReportDocumentEditor;
  let sut: UpdateReportLineUseCase;
  let report: ReportSnapshot;
  beforeEach(() => {
    reports = new InMemoryReportsRepository();
    editor = new InMemoryReportDocumentEditor();
    report = ReportSnapshot.create({
      content: new InMemoryReportDocument({}),
      version: 1,
    });
    reports.items.push(report);
    sut = new UpdateReportLineUseCase(
      reports,
      new UpdateReportUseCase(reports),
      editor,
    );
  });
  const input = {
    index: 0,
    expectedVersion: 1,
    requiredQuantity: 10,
    completedQuantity: 3,
    unitTimeSeconds: 20,
    setupTimeSeconds: 5,
  };
  it('saves valid changes through its contracts', async () => {
    const result = await sut.execute({ id: report.id.toString(), ...input });
    expect(result.isRight()).toBe(true);
    expect(editor.lineChanges[0]).toMatchObject({
      requiredQuantity: 10,
      completedQuantity: 3,
    });
    expect(reports.items[0].version).toBe(2);
    expect(readTestReportData(reports.items[0].content).edited).toBe(true);
  });
  it('rejects excess production without updating the document', async () => {
    const result = await sut.execute({
      id: report.id.toString(),
      ...input,
      completedQuantity: 11,
    });
    expect(result.value).toBeInstanceOf(InvalidLineValuesError);
    expect(editor.lineChanges).toHaveLength(0);
    expect(reports.items[0].version).toBe(1);
  });
  it('rejects an obsolete version without updating the document', async () => {
    const result = await sut.execute({
      id: report.id.toString(),
      ...input,
      expectedVersion: 2,
    });
    expect(result.value).toBeInstanceOf(VersionConflictError);
    expect(editor.lineChanges).toHaveLength(0);
  });
});
