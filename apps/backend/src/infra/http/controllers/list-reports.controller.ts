import { Controller, Get, UseGuards } from '@nestjs/common';
import { ListReportsUseCase } from '../../../domain/sequencing/application/usecases/list-reports-usecase.ts';
import { ExistingUserGuard } from '../../auth/existing-user.guard.ts';

@Controller('/relatorios')
export class ListReportsController {
  constructor(private readonly list: ListReportsUseCase) {}

  @Get()
  @UseGuards(ExistingUserGuard)
  async handle() {
    const result = await this.list.execute();
    if (result.isLeft()) {
      throw new Error('Unexpected report listing failure.');
    }
    return {
      relatorios: result.value.reports.map((report) => ({
        id: report.id,
        versao: report.version,
        nome: report.name,
        machineId: report.machineId,
        dailyAreas: report.dailyAreas,
      })),
    };
  }
}
