import {
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { z } from 'zod';
import { AuthenticateUserUseCase } from '../../../domain/auth/application/usecases/authenticate-user-usecase.ts';
import { Public } from '../../auth/public.ts';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe.ts';

const loginSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  senha: z.string().min(1).max(256),
});
type LoginBody = z.infer<typeof loginSchema>;

@Controller('/sessions')
export class CreateSessionController {
  constructor(private readonly authenticate: AuthenticateUserUseCase) {}

  @Public()
  @Post()
  @HttpCode(200)
  async handle(@Body(new ZodValidationPipe(loginSchema)) body: LoginBody) {
    const result = await this.authenticate.execute({
      email: body.email,
      password: body.senha,
    });
    if (result.isLeft()) {
      throw new UnauthorizedException(result.value.message);
    }
    return { token: result.value.token };
  }
}
