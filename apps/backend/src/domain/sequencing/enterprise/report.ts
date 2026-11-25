import { Entity } from '../../../core/entities/entity.ts';
import type { UniqueEntityID } from '../../../core/entities/unique-entity-id.ts';

export type ReportValue =
  | string
  | number
  | boolean
  | null
  | ReportValue[]
  | { [key: string]: ReportValue };

export interface ReportProps {
  content: { [key: string]: ReportValue };
  version: number;
}

export class Report extends Entity<ReportProps> {
  get content() {
    return this.props.content;
  }

  get version() {
    return this.props.version;
  }

  static create(props: ReportProps, id?: UniqueEntityID) {
    return new Report(props, id);
  }
}
