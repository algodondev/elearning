import { BadRequestException, Injectable } from '@nestjs/common';
import { QuestionType } from '../entities/question.entity/question.entity';

export interface ScorableQuestion {
  id: string;
  type: QuestionType;
  points: number;
  options: Array<{ id: string; isCorrect: boolean }>;
}

export interface SubmittedAnswer {
  questionId: string;
  selectedOptionIds: string[];
}

export interface ScoredAnswer extends SubmittedAnswer {
  isCorrect: boolean;
  awardedPoints: number;
  maxPoints: number;
}

export interface ScoreResult {
  totalPoints: number;
  awardedPoints: number;
  score: number;
  passed: boolean;
  answers: ScoredAnswer[];
}

@Injectable()
export class ScoringService {
  score(
    questions: ScorableQuestion[],
    submittedAnswers: SubmittedAnswer[],
    passingScore: number,
  ): ScoreResult {
    if (questions.length === 0) {
      this.invalid('ASSESSMENT_HAS_NO_QUESTIONS');
    }

    if (passingScore <= 0 || passingScore > 100) {
      this.invalid('INVALID_PASSING_SCORE');
    }

    const answersByQuestion = new Map<string, SubmittedAnswer>();
    for (const answer of submittedAnswers) {
      if (answersByQuestion.has(answer.questionId)) {
        this.invalid('DUPLICATE_QUESTION_ANSWER');
      }
      answersByQuestion.set(answer.questionId, answer);
    }

    if (
      submittedAnswers.length !== questions.length ||
      submittedAnswers.some(
        (answer) =>
          !questions.some((question) => question.id === answer.questionId),
      )
    ) {
      this.invalid('ALL_QUESTIONS_MUST_BE_ANSWERED');
    }

    const answers = questions.map((question): ScoredAnswer => {
      const answer = answersByQuestion.get(question.id);
      if (!answer) {
        this.invalid('ALL_QUESTIONS_MUST_BE_ANSWERED');
      }

      const selected = answer.selectedOptionIds;
      if (selected.length === 0 || new Set(selected).size !== selected.length) {
        this.invalid('INVALID_OPTION_SELECTION');
      }

      const allowedOptionIds = new Set(
        question.options.map((option) => option.id),
      );
      if (selected.some((optionId) => !allowedOptionIds.has(optionId))) {
        this.invalid('OPTION_DOES_NOT_BELONG_TO_QUESTION');
      }

      if (
        question.type !== QuestionType.MULTIPLE_CHOICE &&
        selected.length !== 1
      ) {
        this.invalid('QUESTION_REQUIRES_ONE_OPTION');
      }

      const correct = question.options
        .filter((option) => option.isCorrect)
        .map((option) => option.id)
        .sort();
      const actual = [...selected].sort();
      const isCorrect =
        correct.length === actual.length &&
        correct.every((optionId, index) => optionId === actual[index]);
      const maxPoints = Number(question.points);

      return {
        questionId: question.id,
        selectedOptionIds: selected,
        isCorrect,
        awardedPoints: isCorrect ? maxPoints : 0,
        maxPoints,
      };
    });

    const totalPoints = answers.reduce(
      (total, answer) => total + answer.maxPoints,
      0,
    );
    if (totalPoints <= 0) {
      this.invalid('ASSESSMENT_TOTAL_POINTS_MUST_BE_POSITIVE');
    }
    const awardedPoints = answers.reduce(
      (total, answer) => total + answer.awardedPoints,
      0,
    );
    const score = Math.round((awardedPoints / totalPoints) * 10000) / 100;

    return {
      totalPoints,
      awardedPoints,
      score,
      passed: score >= passingScore,
      answers,
    };
  }

  private invalid(code: string): never {
    throw new BadRequestException({
      code,
      message: 'The submitted assessment answers are invalid.',
    });
  }
}
