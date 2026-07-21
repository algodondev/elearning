import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import { CourseEntity } from '../../../courses/entities/course.entity/course.entity';
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
import { AssessmentAttemptEntity } from '../assessment-attempt.entity/assessment-attempt.entity';
import { QuestionEntity } from '../question.entity/question.entity';

export enum AssessmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  RETIRED = 'RETIRED',
}

@Entity({ name: 'assessments' })
@Unique('UQ_assessments_course_version', ['courseId', 'version'])
@Check('CHK_assessments_version_positive', 'version > 0')
@Check(
  'CHK_assessments_passing_score',
  'passing_score > 0 AND passing_score <= 100',
)
export class AssessmentEntity extends AppBaseEntity {
  @Index()
  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @ManyToOne(() => CourseEntity, (course) => course.assessments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'course_id' })
  course!: CourseEntity;

  @Column({ type: 'integer' })
  version!: number;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  instructions!: string | null;

  @Column({ name: 'passing_score', type: 'numeric', precision: 5, scale: 2 })
  passingScore!: number;

  @Column({
    type: 'enum',
    enum: AssessmentStatus,
    default: AssessmentStatus.DRAFT,
  })
  status!: AssessmentStatus;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @OneToMany(() => QuestionEntity, (question) => question.assessment)
  questions?: QuestionEntity[];

  @OneToMany(() => AssessmentAttemptEntity, (attempt) => attempt.assessment)
  attempts?: AssessmentAttemptEntity[];
}
