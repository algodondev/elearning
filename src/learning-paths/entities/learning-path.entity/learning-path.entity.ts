import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { LearningPathCourseEntity } from '../learning-path-course.entity/learning-path-course.entity';
import { LearningPathEnrollmentEntity } from '../learning-path-enrollment.entity/learning-path-enrollment.entity';

export enum LearningPathStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

@Entity({ name: 'learning_paths' })
export class LearningPathEntity extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: LearningPathStatus,
    default: LearningPathStatus.DRAFT,
  })
  status!: LearningPathStatus;

  @OneToMany(() => LearningPathCourseEntity, (item) => item.learningPath)
  courses?: LearningPathCourseEntity[];

  @OneToMany(
    () => LearningPathEnrollmentEntity,
    (enrollment) => enrollment.learningPath,
  )
  enrollments?: LearningPathEnrollmentEntity[];
}
