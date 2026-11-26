import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { RegisterUserUseCase } from '../../../domain/auth/application/usecases/register-user-usecase.ts';
import { EmailAlreadyRegisteredError } from '../../../domain/auth/application/usecases/errors/email-already-registered-error.ts';
import { AdministratorGuard } from '../../auth/administrator.guard.ts';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe.ts';
import { UserPresenter } from '../presenters/user-presenter.ts';

const schema = z.object({
  email: z.string().trim().pipe(z.email()),
  senha: z.string(),
  podeEditar: z.boolean(),
  podeExportar: z.boolean(),
});
type Body = z.infer<typeof schema>;

@Controller('/usuarios')
export class RegisterUserController {
  constructor(private readonly register: RegisterUserUseCase) {}

  @Post()
  @UseGuards(AdministratorGuard)
  async handle(@Body(new ZodValidationPipe(schema)) body: Body) {
    const result = await this.register.execute({
      email: body.email,
      password: body.senha,
      canEdit: body.podeEditar,
      canExport: body.podeExportar,
    });
    if (result.isLeft()) {
      if (result.value instanceof EmailAlreadyRegisteredError) {
        throw new ConflictException(result.value.message);
      }
      throw new BadRequestException(result.value.message);
    }
    return UserPresenter.toHTTP(result.value.user);
  }
}
