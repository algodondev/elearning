import { BadRequestException } from '@nestjs/common';
import { QuestionType } from '../entities/question.entity/question.entity';
import { ScoringService } from './scoring.service';

type ScoreApi = {
  score: (
    questions: Array<{
      id: string;
      type: QuestionType;
      points: number;
      options: Array<{ id: string; isCorrect: boolean }>;
    }>,
    answers: Array<{ questionId: string; selectedOptionIds: string[] }>,
    passingScore: number,
  ) => {
    totalPoints: number;
    awardedPoints: number;
    score: number;
    passed: boolean;
    answers: Array<{ questionId: string; isCorrect: boolean }>;
  };
};

describe('ScoringService', () => {
  const service = new ScoringService() as unknown as ScoreApi;
  const questions = [
    {
      id: 'single',
      type: QuestionType.SINGLE_CHOICE,
      points: 2,
      options: [
        { id: 's1', isCorrect: true },
        { id: 's2', isCorrect: false },
      ],
    },
    {
      id: 'multiple',
      type: QuestionType.MULTIPLE_CHOICE,
      points: 3,
      options: [
        { id: 'm1', isCorrect: true },
        { id: 'm2', isCorrect: true },
        { id: 'm3', isCorrect: false },
      ],
    },
  ];

  it('awards exact-match points and passes at the threshold', () => {
    const result = service.score(
      questions,
      [
        { questionId: 'single', selectedOptionIds: ['s1'] },
        { questionId: 'multiple', selectedOptionIds: ['m2', 'm1'] },
      ],
      100,
    );

    expect(result).toMatchObject({
      totalPoints: 5,
      awardedPoints: 5,
      score: 100,
      passed: true,
    });
  });

  it('gives no partial credit for a multiple-choice answer', () => {
    const result = service.score(
      questions,
      [
        { questionId: 'single', selectedOptionIds: ['s1'] },
        { questionId: 'multiple', selectedOptionIds: ['m1'] },
      ],
      40,
    );

    expect(result).toMatchObject({ awardedPoints: 2, score: 40, passed: true });
  });

  it.each([
    ['missing answer', [{ questionId: 'single', selectedOptionIds: ['s1'] }]],
    [
      'duplicate answer',
      [
        { questionId: 'single', selectedOptionIds: ['s1'] },
        { questionId: 'single', selectedOptionIds: ['s1'] },
      ],
    ],
    [
      'foreign option',
      [
        { questionId: 'single', selectedOptionIds: ['m1'] },
        { questionId: 'multiple', selectedOptionIds: ['m1', 'm2'] },
      ],
    ],
    [
      'duplicate selection',
      [
        { questionId: 'single', selectedOptionIds: ['s1', 's1'] },
        { questionId: 'multiple', selectedOptionIds: ['m1', 'm2'] },
      ],
    ],
  ])('rejects %s', (_label, answers) => {
    expect(() => service.score(questions, answers, 70)).toThrow(
      BadRequestException,
    );
  });
});
