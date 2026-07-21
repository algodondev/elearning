import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import { CourseModuleEntity } from '../../../courses/entities/course-module.entity/course-module.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { EnrollmentEntity } from '../enrollment.entity/enrollment.entity';

export enum ModuleProgressStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

@Entity({ name: 'module_progress' })
@Unique('UQ_module_progress_enrollment_module', ['enrollmentId', 'moduleId'])
@Index('IDX_module_progress_enrollment_status', ['enrollmentId', 'status'])
export class ModuleProgressEntity extends AppBaseEntity {
  @Column({ name: 'enrollment_id', type: 'uuid' })
  enrollmentId!: string;

  @ManyToOne(
    () => EnrollmentEntity,
    (enrollment) => enrollment.moduleProgress,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'enrollment_id' })
  enrollment!: EnrollmentEntity;

  @Column({ name: 'module_id', type: 'uuid' })
  moduleId!: string;

  @ManyToOne(() => CourseModuleEntity, (module) => module.progressRecords, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'module_id' })
  module!: CourseModuleEntity;

  @Column({ type: 'enum', enum: ModuleProgressStatus })
  status!: ModuleProgressStatus;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;
}
