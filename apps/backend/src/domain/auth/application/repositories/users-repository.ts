import { Injectable } from '@nestjs/common';
import type { User } from '../../enterprise/user.ts';

@Injectable()
export abstract class UsersRepository {
  abstract list(): Promise<User[]>;
  abstract updatePermissions(
    id: string,
    canEdit: boolean,
    canExport: boolean,
  ): Promise<User | null>;
  abstract createIfEmailAvailable(user: User): Promise<boolean>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
}
