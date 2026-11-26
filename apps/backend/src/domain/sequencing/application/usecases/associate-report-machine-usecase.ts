import { Injectable } from '@nestjs/common';
import { left, type Either } from '../../../../core/either.ts';
import { MachinesRepository } from '../../../production/application/repositories/machines-repository.ts';
import { ReportsRepository } from '../repositories/reports-repository.ts';
import { ReportDocumentEditor } from '../services/report-document-editor.ts';
import type { ReportSnapshot } from '../models/report-snapshot.ts';
import { ReportNotFoundError } from './errors/report-not-found-error.ts';
import { VersionConflictError } from './errors/version-conflict-error.ts';
import { MachineNotFoundError } from './errors/machine-not-found-error.ts';
import { UpdateReportUseCase } from './update-report-usecase.ts';

@Injectable()
export class AssociateReportMachineUseCase {
  constructor(
    private readonly machines: MachinesRepository,
    private readonly reports: ReportsRepository,
    private readonly editor: ReportDocumentEditor,
    private readonly update: UpdateReportUseCase,
  ) {}

  async execute(request: {
    id: string;
    machineId: string | null;
    expectedVersion: number;
  }): Promise<
    Either<
      MachineNotFoundError | ReportNotFoundError | VersionConflictError,
      { report: ReportSnapshot }
    >
  > {
    if (request.machineId !== null) {
      const machines = await this.machines.list();
      if (
        !machines.some((machine) => machine.id.toString() === request.machineId)
      )
        return left(new MachineNotFoundError());
    }
    const report = await this.reports.findById(request.id);
    if (!report) return left(new ReportNotFoundError());
    if (report.version !== request.expectedVersion)
      return left(new VersionConflictError());
    const content = this.editor.updateMachine(
      report.content,
      request.machineId,
    );
    return this.update.execute({
      id: request.id,
      expectedVersion: request.expectedVersion,
      content,
    });
  }
}
