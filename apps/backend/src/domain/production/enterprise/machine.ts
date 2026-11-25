import { Entity } from '../../../core/entities/entity.ts';
import type { UniqueEntityID } from '../../../core/entities/unique-entity-id.ts';
export class Machine extends Entity<{ name: string; pdfTitle: string }> {
  get name() {
    return this.props.name;
  }
  get pdfTitle() {
    return this.props.pdfTitle;
  }
  static create(
    props: { name: string; pdfTitle: string },
    id?: UniqueEntityID,
  ) {
    return new Machine(props, id);
  }
}
