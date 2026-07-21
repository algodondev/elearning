import { ConflictException, NotFoundException } from '@nestjs/common';
import { UnlockPolicyService } from './unlock-policy.service';

describe('UnlockPolicyService', () => {
  const service = new UnlockPolicyService();

  it('unlocks the first course', () => {
    expect(() =>
      service.assertUnlocked(['course-1', 'course-2'], 'course-1', new Set()),
    ).not.toThrow();
  });

  it('blocks a course while the immediately previous course is not passed', () => {
    expect(() =>
      service.assertUnlocked(['course-1', 'course-2'], 'course-2', new Set()),
    ).toThrow(ConflictException);
  });

  it('accepts a historical pass for the immediately previous course', () => {
    expect(() =>
      service.assertUnlocked(
        ['course-1', 'course-2'],
        'course-2',
        new Set(['course-1']),
      ),
    ).not.toThrow();
  });

  it('rejects a course outside the path', () => {
    expect(() =>
      service.assertUnlocked(['course-1'], 'other-course', new Set()),
    ).toThrow(NotFoundException);
  });
});
