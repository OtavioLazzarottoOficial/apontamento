import { Entity } from '../../../core/entities/entity.ts';
import type { UniqueEntityID } from '../../../core/entities/unique-entity-id.ts';

export type UserRole = 'ADMINISTRADOR' | 'USUARIO';
export interface UserProps {
  email: string;
  passwordHash: string;
  role: UserRole;
  canEdit: boolean;
  canExport: boolean;
}

export class User extends Entity<UserProps> {
  get email() {
    return this.props.email;
  }
  get passwordHash() {
    return this.props.passwordHash;
  }
  get role() {
    return this.props.role;
  }
  get canEdit() {
    return this.props.canEdit;
  }
  get canExport() {
    return this.props.canExport;
  }

  static create(props: UserProps, id?: UniqueEntityID) {
    return new User(props, id);
  }
}
