import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { CourseModuleEntity } from '../course-module.entity/course-module.entity';

export enum ContentType {
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  LINK = 'LINK',
  TEXT = 'TEXT',
}

@Entity({ name: 'module_contents' })
@Unique('UQ_module_contents_sequence', ['moduleId', 'sequenceNumber'])
@Check('CHK_module_contents_sequence_positive', 'sequence_number > 0')
export class ModuleContentEntity extends AppBaseEntity {
  @Index()
  @Column({ name: 'module_id', type: 'uuid' })
  moduleId!: string;

  @ManyToOne(() => CourseModuleEntity, (module) => module.contents, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'module_id' })
  module!: CourseModuleEntity;

  @Column({ length: 200 })
  title!: string;

  @Column({ name: 'content_type', type: 'enum', enum: ContentType })
  contentType!: ContentType;

  @Column({ name: 'content_url', type: 'text', nullable: true })
  contentUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  body!: string | null;

  @Column({ name: 'sequence_number', type: 'integer' })
  sequenceNumber!: number;
}
