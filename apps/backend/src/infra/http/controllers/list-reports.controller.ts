import { Controller, Get, UseGuards } from '@nestjs/common';
import { ListReportsUseCase } from '../../../domain/sequencing/application/usecases/list-reports-usecase.ts';
import { ExistingUserGuard } from '../../auth/existing-user.guard.ts';

@Controller('/relatorios')
export class ListReportsController {
  constructor(private readonly list: ListReportsUseCase) {}

  @Get()
  @UseGuards(ExistingUserGuard)
  async handle() {
    const resultado = await this.list.execute();
    return resultado.value;
  }
}
