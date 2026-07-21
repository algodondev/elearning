import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
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
import { QuestionOptionEntity } from '../question-option.entity/question-option.entity';

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
}

@Entity({ name: 'questions' })
@Unique('UQ_questions_assessment_sequence', ['assessmentId', 'sequenceNumber'])
@Check('CHK_questions_points_positive', 'points > 0')
@Check('CHK_questions_sequence_positive', 'sequence_number > 0')
export class QuestionEntity extends AppBaseEntity {
  @Index()
  @Column({ name: 'assessment_id', type: 'uuid' })
  assessmentId!: string;

  @ManyToOne(() => AssessmentEntity, (assessment) => assessment.questions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'assessment_id' })
  assessment!: AssessmentEntity;

  @Column({ type: 'text' })
  prompt!: string;

  @Column({ name: 'question_type', type: 'enum', enum: QuestionType })
  questionType!: QuestionType;

  @Column({ type: 'numeric', precision: 8, scale: 2 })
  points!: number;

  @Column({ name: 'sequence_number', type: 'integer' })
  sequenceNumber!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => QuestionOptionEntity, (option) => option.question)
  options?: QuestionOptionEntity[];

  @OneToMany(() => AttemptAnswerEntity, (answer) => answer.question)
  answers?: AttemptAnswerEntity[];
}
