import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class UnlockPolicyService {
  assertUnlocked(
    orderedCourseIds: string[],
    targetCourseId: string,
    passedCourseIds: ReadonlySet<string>,
  ): void {
    const targetIndex = orderedCourseIds.indexOf(targetCourseId);
    if (targetIndex === -1) {
      throw new NotFoundException({
        code: 'COURSE_NOT_IN_LEARNING_PATH',
        message: 'The course does not belong to this learning path.',
      });
    }

    if (targetIndex === 0) {
      return;
    }

    const previousCourseId = orderedCourseIds[targetIndex - 1];
    if (!passedCourseIds.has(previousCourseId)) {
      throw new ConflictException({
        code: 'LEARNING_PATH_PREREQUISITE_NOT_PASSED',
        message: 'The immediately previous course must be passed first.',
        details: { previousCourseId },
      });
    }
  }
}
