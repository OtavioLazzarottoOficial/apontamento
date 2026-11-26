import {
  InMemoryReportDocument,
  readTestReportData,
} from '../../../../../test/services-in-memory/in-memory-report-document.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.ts';
import { Machine } from '../../../production/enterprise/machine.ts';
import { InMemoryMachinesRepository } from '../../../../../test/repositories-in-memory/in-memory-machines-repository.ts';
import { InMemoryReportsRepository } from '../../../../../test/repositories-in-memory/in-memory-reports-repository.ts';
import { InMemoryReportDocumentEditor } from '../../../../../test/services-in-memory/in-memory-report-document-editor.ts';
import { ReportSnapshot } from '../models/report-snapshot.ts';
import { AssociateReportMachineUseCase } from './associate-report-machine-usecase.ts';
import { UpdateReportUseCase } from './update-report-usecase.ts';
import { MachineNotFoundError } from './errors/machine-not-found-error.ts';
import { VersionConflictError } from './errors/version-conflict-error.ts';

describe('AssociateReportMachineUseCase', () => {
  let machines: InMemoryMachinesRepository;
  let reports: InMemoryReportsRepository;
  let sut: AssociateReportMachineUseCase;
  let report: ReportSnapshot;
  beforeEach(() => {
    machines = new InMemoryMachinesRepository();
    reports = new InMemoryReportsRepository();
    machines.items.push(
      Machine.create(
        { name: 'Drill', pdfTitle: 'Drill' },
        new UniqueEntityID('machine-id'),
      ),
    );
    report = ReportSnapshot.create({
      content: new InMemoryReportDocument({ nome: 'map.pdf' }),
      version: 1,
    });
    reports.items.push(report);
    sut = new AssociateReportMachineUseCase(
      machines,
      reports,
      new InMemoryReportDocumentEditor(),
      new UpdateReportUseCase(reports),
    );
  });
  it('associates and unlinks the machine while retaining the report', async () => {
    expect(
      (
        await sut.execute({
          id: report.id.toString(),
          machineId: 'machine-id',
          expectedVersion: 1,
        })
      ).isRight(),
    ).toBe(true);
    expect(readTestReportData(reports.items[0].content).machineId).toBe(
      'machine-id',
    );
    expect(
      (
        await sut.execute({
          id: report.id.toString(),
          machineId: null,
          expectedVersion: 2,
        })
      ).isRight(),
    ).toBe(true);
    expect(readTestReportData(reports.items[0].content)).toMatchObject({
      nome: 'map.pdf',
      machineId: null,
    });
  });
  it('rejects unknown machines and stale versions without saving', async () => {
    expect(
      (
        await sut.execute({
          id: report.id.toString(),
          machineId: 'missing',
          expectedVersion: 1,
        })
      ).value,
    ).toBeInstanceOf(MachineNotFoundError);
    expect(
      (
        await sut.execute({
          id: report.id.toString(),
          machineId: 'machine-id',
          expectedVersion: 2,
        })
      ).value,
    ).toBeInstanceOf(VersionConflictError);
    expect(reports.items[0].version).toBe(1);
  });
});
