import {
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { z } from 'zod';
import { AutenticarUsuarioUseCase } from '../../../domain/auth/application/usecases/autenticar-usuario-usecase.ts';
import { Public } from '../../auth/public.ts';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe.ts';

const loginSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  senha: z.string().min(1).max(256),
});
type LoginBody = z.infer<typeof loginSchema>;

@Controller('/sessions')
export class CriarSessaoController {
  constructor(private readonly autenticar: AutenticarUsuarioUseCase) {}

  @Public()
  @Post()
  @HttpCode(200)
  async handle(@Body(new ZodValidationPipe(loginSchema)) body: LoginBody) {
    const result = await this.autenticar.execute(body);
    if (result.isLeft()) {
      throw new UnauthorizedException(result.value.message);
    }
    return { token: result.value.token };
  }
}
