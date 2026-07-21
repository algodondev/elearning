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
import { AttemptAnswerOptionEntity } from '../attempt-answer-option.entity/attempt-answer-option.entity';
import { QuestionEntity } from '../question.entity/question.entity';

@Entity({ name: 'question_options' })
@Unique('UQ_question_options_sequence', ['questionId', 'sequenceNumber'])
@Check('CHK_question_options_sequence_positive', 'sequence_number > 0')
export class QuestionOptionEntity extends AppBaseEntity {
  @Index()
  @Column({ name: 'question_id', type: 'uuid' })
  questionId!: string;

  @ManyToOne(() => QuestionEntity, (question) => question.options, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'question_id' })
  question!: QuestionEntity;

  @Column({ name: 'option_text', type: 'text' })
  optionText!: string;

  @Column({ name: 'is_correct' })
  isCorrect!: boolean;

  @Column({ name: 'sequence_number', type: 'integer' })
  sequenceNumber!: number;

  @OneToMany(() => AttemptAnswerOptionEntity, (selection) => selection.option)
  selections?: AttemptAnswerOptionEntity[];
}
