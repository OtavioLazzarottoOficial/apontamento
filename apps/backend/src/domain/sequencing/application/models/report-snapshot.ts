import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.ts';

import type { ReportDocument } from './report-document.ts';

export interface ReportSnapshotProps {
  content: ReportDocument;
  version: number;
}

export class ReportSnapshot {
  readonly id: UniqueEntityID;
  readonly content: ReportDocument;
  readonly version: number;

  private constructor(props: ReportSnapshotProps, id?: UniqueEntityID) {
    this.id = id ?? new UniqueEntityID();
    this.content = props.content;
    this.version = props.version;
  }

  static create(props: ReportSnapshotProps, id?: UniqueEntityID) {
    return new ReportSnapshot(props, id);
  }
}
