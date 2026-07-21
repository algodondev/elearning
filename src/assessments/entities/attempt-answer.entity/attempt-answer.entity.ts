import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { AssessmentAttemptEntity } from '../assessment-attempt.entity/assessment-attempt.entity';
import { AttemptAnswerOptionEntity } from '../attempt-answer-option.entity/attempt-answer-option.entity';
import { QuestionEntity } from '../question.entity/question.entity';

@Entity({ name: 'attempt_answers' })
@Unique('UQ_attempt_answers_question', ['attemptId', 'questionId'])
export class AttemptAnswerEntity extends AppBaseEntity {
  @Column({ name: 'attempt_id', type: 'uuid' })
  attemptId!: string;

  @ManyToOne(() => AssessmentAttemptEntity, (attempt) => attempt.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attempt_id' })
  attempt!: AssessmentAttemptEntity;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId!: string;

  @ManyToOne(() => QuestionEntity, (question) => question.answers, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'question_id' })
  question!: QuestionEntity;

  @Column({
    name: 'max_points_snapshot',
    type: 'numeric',
    precision: 8,
    scale: 2,
  })
  maxPointsSnapshot!: number;

  @Column({ name: 'awarded_points', type: 'numeric', precision: 8, scale: 2 })
  awardedPoints!: number;

  @Column({ name: 'is_correct' })
  isCorrect!: boolean;

  @OneToMany(() => AttemptAnswerOptionEntity, (selection) => selection.answer)
  selections?: AttemptAnswerOptionEntity[];
}
