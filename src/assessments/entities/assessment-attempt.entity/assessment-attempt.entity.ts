import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import { EnrollmentEntity } from '../../../enrollments/entities/enrollment.entity/enrollment.entity';
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
import { AssessmentEntity } from '../assessment.entity/assessment.entity';
import { AttemptAnswerEntity } from '../attempt-answer.entity/attempt-answer.entity';

@Entity({ name: 'assessment_attempts' })
@Unique('UQ_assessment_attempt_number', ['enrollmentId', 'attemptNumber'])
@Check('CHK_assessment_attempt_number', 'attempt_number BETWEEN 1 AND 3')
@Check('CHK_assessment_attempt_score', 'score >= 0 AND score <= 100')
export class AssessmentAttemptEntity extends AppBaseEntity {
  @Index()
  @Column({ name: 'enrollment_id', type: 'uuid' })
  enrollmentId!: string;

  @ManyToOne(() => EnrollmentEntity, (enrollment) => enrollment.attempts, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment!: EnrollmentEntity;

  @Column({ name: 'assessment_id', type: 'uuid' })
  assessmentId!: string;

  @ManyToOne(() => AssessmentEntity, (assessment) => assessment.attempts, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'assessment_id' })
  assessment!: AssessmentEntity;

  @Column({ name: 'attempt_number', type: 'integer' })
  attemptNumber!: number;

  @Column({ name: 'total_points', type: 'numeric', precision: 8, scale: 2 })
  totalPoints!: number;

  @Column({ name: 'awarded_points', type: 'numeric', precision: 8, scale: 2 })
  awardedPoints!: number;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  score!: number;

  @Column({
    name: 'passing_score_snapshot',
    type: 'numeric',
    precision: 5,
    scale: 2,
  })
  passingScoreSnapshot!: number;

  @Column()
  passed!: boolean;

  @Column({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt!: Date;

  @OneToMany(() => AttemptAnswerEntity, (answer) => answer.attempt)
  answers?: AttemptAnswerEntity[];
}
