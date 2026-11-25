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
    const resultado = await this.register.execute(body);
    if (resultado.isLeft()) {
      if (resultado.value instanceof EmailAlreadyRegisteredError) {
        throw new ConflictException(resultado.value.message);
      }
      throw new BadRequestException(resultado.value.message);
    }
    const usuario = resultado.value.usuario;
    return {
      id: usuario.id.toString(),
      email: usuario.email,
      papel: usuario.role,
      podeEditar: usuario.canEdit,
      podeExportar: usuario.canExport,
    };
  }
}
