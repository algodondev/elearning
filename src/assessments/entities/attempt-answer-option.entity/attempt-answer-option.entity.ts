import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import { Entity, JoinColumn, ManyToOne, Unique, Column } from 'typeorm';
import { AttemptAnswerEntity } from '../attempt-answer.entity/attempt-answer.entity';
import { QuestionOptionEntity } from '../question-option.entity/question-option.entity';

@Entity({ name: 'attempt_answer_options' })
@Unique('UQ_attempt_answer_selected_option', [
  'attemptAnswerId',
  'questionOptionId',
])
export class AttemptAnswerOptionEntity extends AppBaseEntity {
  @Column({ name: 'attempt_answer_id', type: 'uuid' })
  attemptAnswerId!: string;

  @ManyToOne(() => AttemptAnswerEntity, (answer) => answer.selections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attempt_answer_id' })
  answer!: AttemptAnswerEntity;

  @Column({ name: 'question_option_id', type: 'uuid' })
  questionOptionId!: string;

  @ManyToOne(() => QuestionOptionEntity, (option) => option.selections, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'question_option_id' })
  option!: QuestionOptionEntity;
}
