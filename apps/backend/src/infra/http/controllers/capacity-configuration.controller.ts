import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { z } from 'zod';
import { GetCapacityConfigurationUseCase } from '../../../domain/production/application/usecases/get-capacity-configuration-usecase.ts';
import { UpdateCapacityConfigurationUseCase } from '../../../domain/production/application/usecases/update-capacity-configuration-usecase.ts';
import { AdministratorGuard } from '../../auth/administrator.guard.ts';
import { ExistingUserGuard } from '../../auth/existing-user.guard.ts';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe.ts';
import { CapacityConfigurationPresenter } from '../presenters/capacity-configuration-presenter.ts';

const schema = z.object({
  eficienciaPercentual: z.number().int().min(1).max(100),
});

@Controller('/configuracao/capacidade')
@UseGuards(ExistingUserGuard)
export class CapacityConfigurationController {
  constructor(
    private readonly getConfiguration: GetCapacityConfigurationUseCase,
    private readonly updateConfiguration: UpdateCapacityConfigurationUseCase,
  ) {}

  @Get()
  async obter() {
    const result = await this.getConfiguration.execute();
    if (result.isLeft()) {
      throw new Error('Falha inesperada ao obter configuração.');
    }

    return CapacityConfigurationPresenter.toHTTP(
      result.value.efficiencyPercentage,
    );
  }

  @Put()
  @UseGuards(AdministratorGuard)
  async alterar(
    @Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>,
  ) {
    const result = await this.updateConfiguration.execute(
      body.eficienciaPercentual,
    );
    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    return CapacityConfigurationPresenter.toHTTP(
      result.value.configuration.efficiencyPercentage,
    );
  }
}
