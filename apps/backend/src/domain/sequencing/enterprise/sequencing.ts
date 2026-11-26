import { Entity } from '../../../core/entities/entity.ts';
import type { UniqueEntityID } from '../../../core/entities/unique-entity-id.ts';
import { summarizeSequencing } from './services/summarize-sequencing.ts';
import type { SequencingLineObjectValue } from './value-objects/sequencing-line-object-value.ts';

export interface SequencingProps {
  lines: readonly SequencingLineObjectValue[];
}

export class Sequencing extends Entity<SequencingProps> {
  get lines(): readonly SequencingLineObjectValue[] {
    return [...this.props.lines];
  }

  summarize() {
    return summarizeSequencing(this.props.lines);
  }

  static create(props: SequencingProps, id?: UniqueEntityID) {
    return new Sequencing({ lines: [...props.lines] }, id);
  }
}
