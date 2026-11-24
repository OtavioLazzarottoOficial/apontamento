import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { CadastrarUsuarioUseCase } from '../../../domain/auth/application/usecases/cadastrar-usuario-usecase.ts';
import { EmailJaCadastradoError } from '../../../domain/auth/application/usecases/errors/email-ja-cadastrado-error.ts';
import { AdministradorGuard } from '../../auth/administrador.guard.ts';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe.ts';

const schema = z.object({
  email: z.string().trim().pipe(z.email()),
  senha: z.string(),
  podeEditar: z.boolean(),
  podeExportar: z.boolean(),
});
type Body = z.infer<typeof schema>;

@Controller('/usuarios')
export class CadastrarUsuarioController {
  constructor(private readonly cadastrar: CadastrarUsuarioUseCase) {}

  @Post()
  @UseGuards(AdministradorGuard)
  async handle(@Body(new ZodValidationPipe(schema)) body: Body) {
    const resultado = await this.cadastrar.execute(body);
    if (resultado.isLeft()) {
      if (resultado.value instanceof EmailJaCadastradoError) {
        throw new ConflictException(resultado.value.message);
      }
      throw new BadRequestException(resultado.value.message);
    }
    const usuario = resultado.value.usuario;
    return {
      id: usuario.id.toString(),
      email: usuario.email,
      papel: usuario.papel,
      podeEditar: usuario.podeEditar,
      podeExportar: usuario.podeExportar,
    };
  }
}
