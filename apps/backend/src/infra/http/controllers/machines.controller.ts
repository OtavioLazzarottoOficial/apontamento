import {
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { ManageMachinesUseCase } from '../../../domain/production/application/usecases/manage-machines-usecase.ts';
import { EditPermissionGuard } from '../../auth/edit-permission.guard.ts';
import { ExistingUserGuard } from '../../auth/existing-user.guard.ts';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe.ts';
const schema = z.object({
  name: z.string().trim().min(1).max(150),
  pdfTitle: z.string().trim().min(1).max(200).optional(),
});
@Controller('/maquinas')
export class MachinesController {
  constructor(private readonly manage: ManageMachinesUseCase) {}
  @Get()
  @UseGuards(ExistingUserGuard)
  async list() {
    return {
      machines: (await this.manage.list()).map((machine) => ({
        id: machine.id.toString(),
        name: machine.name,
        pdfTitle: machine.pdfTitle,
      })),
    };
  }
  @Patch(':id')
  @UseGuards(EditPermissionGuard)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>,
  ) {
    const result = await this.manage.update(id, body.name, body.pdfTitle);
    if (result.isLeft()) throw new ConflictException(result.value.message);
    return {
      id: result.value.id.toString(),
      name: result.value.name,
      pdfTitle: result.value.pdfTitle,
    };
  }
  @Post()
  @UseGuards(EditPermissionGuard)
  async create(
    @Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>,
  ) {
    const result = await this.manage.create(body.name, body.pdfTitle);
    if (result.isLeft()) throw new ConflictException(result.value.message);
    return {
      id: result.value.id.toString(),
      name: result.value.name,
      pdfTitle: result.value.pdfTitle,
    };
  }
}
