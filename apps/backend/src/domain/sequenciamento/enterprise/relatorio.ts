import { Entity } from '../../../core/entities/entity.ts';
import type { UniqueEntityID } from '../../../core/entities/unique-entity-id.ts';

export type ValorRelatorio =
  | string
  | number
  | boolean
  | null
  | ValorRelatorio[]
  | { [key: string]: ValorRelatorio };

export interface RelatorioProps {
  conteudo: { [key: string]: ValorRelatorio };
  versao: number;
}

export class Relatorio extends Entity<RelatorioProps> {
  get conteudo() {
    return this.props.conteudo;
  }

  get versao() {
    return this.props.versao;
  }

  static create(props: RelatorioProps, id?: UniqueEntityID) {
    return new Relatorio(props, id);
  }
}
