import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import { ModuleProgressEntity } from '../../../enrollments/entities/module-progress.entity/module-progress.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { CourseEntity } from '../course.entity/course.entity';
import { ModuleContentEntity } from '../module-content.entity/module-content.entity';

@Entity({ name: 'course_modules' })
@Unique('UQ_course_modules_sequence', ['courseId', 'sequenceNumber'])
@Check('CHK_course_modules_sequence_positive', 'sequence_number > 0')
@Check('CHK_course_modules_duration_positive', 'estimated_duration_minutes > 0')
export class CourseModuleEntity extends AppBaseEntity {
  @Index()
  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @ManyToOne(() => CourseEntity, (course) => course.modules, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'course_id' })
  course!: CourseEntity;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'sequence_number', type: 'integer' })
  sequenceNumber!: number;

  @Column({ name: 'estimated_duration_minutes', type: 'integer' })
  estimatedDurationMinutes!: number;

  @Column({ name: 'is_required', default: true })
  isRequired!: boolean;

  @OneToMany(() => ModuleContentEntity, (content) => content.module)
  contents?: ModuleContentEntity[];

  @OneToMany(() => ModuleProgressEntity, (progress) => progress.module)
  progressRecords?: ModuleProgressEntity[];
}
