import { Injectable } from '@nestjs/common';
import type { User } from '../../enterprise/user.ts';

@Injectable()
export abstract class UsersRepository {
  abstract list(): Promise<User[]>;
  abstract updatePermissions(
    id: string,
    podeEditar: boolean,
    podeExportar: boolean,
  ): Promise<User | null>;
  abstract createIfEmailAvailable(usuario: User): Promise<boolean>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
}
