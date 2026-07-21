import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { UserRole } from '../../auth/entities/user.entity/user.entity';
import type { AuthenticatedUser } from '../../auth/strategies/jwt.strategy/jwt.strategy';
import { CertificateEntity } from '../../certificates/entities/certificate.entity/certificate.entity';
import { Clock } from '../../common/time/clock/clock';
import {
  EnrollmentEntity,
  EnrollmentStatus,
} from '../../enrollments/entities/enrollment.entity/enrollment.entity';
import { ModuleProgressStatus } from '../../enrollments/entities/module-progress.entity/module-progress.entity';
import {
  LearningPathEnrollmentEntity,
  LearningPathEnrollmentStatus,
} from '../../learning-paths/entities/learning-path-enrollment.entity/learning-path-enrollment.entity';
import { SubmitAttemptDto } from '../dto/assessment.dto/assessment.dto';
import { AssessmentAttemptEntity } from '../entities/assessment-attempt.entity/assessment-attempt.entity';
import {
  AssessmentEntity,
  AssessmentStatus,
} from '../entities/assessment.entity/assessment.entity';
import { AttemptAnswerOptionEntity } from '../entities/attempt-answer-option.entity/attempt-answer-option.entity';
import { AttemptAnswerEntity } from '../entities/attempt-answer.entity/attempt-answer.entity';
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class AttemptsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly scoring: ScoringService,
    private readonly clock: Clock,
  ) {}

  async submit(
    enrollmentId: string,
    dto: SubmitAttemptDto,
    user: AuthenticatedUser,
  ) {
    return this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const lockedEnrollment = await manager
        .getRepository(EnrollmentEntity)
        .findOne({
          where: { id: enrollmentId },
          lock: { mode: 'pessimistic_write' },
        });
      if (!lockedEnrollment)
        throw new NotFoundException('Enrollment not found.');
      const enrollment = await manager.getRepository(EnrollmentEntity).findOne({
        where: { id: enrollmentId },
        relations: { course: true, moduleProgress: { module: true } },
      });
      if (!enrollment) throw new NotFoundException('Enrollment not found.');
      if (
        user.role === UserRole.EMPLOYEE &&
        user.employeeId !== enrollment.employeeId
      )
        throw new ForbiddenException(
          'Employees may only submit their own attempts.',
        );
      const existingCount = await manager
        .getRepository(AssessmentAttemptEntity)
        .countBy({ enrollmentId });
      if (existingCount >= 3) {
        throw new ConflictException({
          code: 'ASSESSMENT_ATTEMPTS_EXHAUSTED',
          message:
            'The enrollment requires re-enrollment before another attempt.',
        });
      }
      const missing = (enrollment.moduleProgress ?? [])
        .filter(
          (progress) =>
            progress.module.isRequired &&
            progress.status !== ModuleProgressStatus.COMPLETED,
        )
        .map((progress) => progress.moduleId);
      if (
        missing.length ||
        enrollment.status !== EnrollmentStatus.READY_FOR_ASSESSMENT
      ) {
        throw new ConflictException({
          code: 'MODULES_INCOMPLETE',
          message: 'All required modules must be completed before an attempt.',
          details: { missingModuleIds: missing },
        });
      }

      const assessment = await manager.getRepository(AssessmentEntity).findOne({
        where: {
          courseId: enrollment.courseId,
          status: AssessmentStatus.PUBLISHED,
        },
        relations: { questions: { options: true } },
      });
      if (!assessment)
        throw new ConflictException('Course has no published assessment.');
      const scored = this.scoring.score(
        (assessment.questions ?? [])
          .filter((question) => question.isActive)
          .map((question) => ({
            id: question.id,
            type: question.questionType,
            points: Number(question.points),
            options: (question.options ?? []).map((option) => ({
              id: option.id,
              isCorrect: option.isCorrect,
            })),
          })),
        dto.answers,
        Number(assessment.passingScore),
      );
      const now = this.clock.now();
      const attempt = await manager
        .getRepository(AssessmentAttemptEntity)
        .save({
          enrollmentId,
          assessmentId: assessment.id,
          attemptNumber: existingCount + 1,
          totalPoints: scored.totalPoints,
          awardedPoints: scored.awardedPoints,
          score: scored.score,
          passingScoreSnapshot: Number(assessment.passingScore),
          passed: scored.passed,
          submittedAt: now,
        });
      for (const scoredAnswer of scored.answers) {
        const answer = await manager.getRepository(AttemptAnswerEntity).save({
          attemptId: attempt.id,
          questionId: scoredAnswer.questionId,
          maxPointsSnapshot: scoredAnswer.maxPoints,
          awardedPoints: scoredAnswer.awardedPoints,
          isCorrect: scoredAnswer.isCorrect,
        });
        await manager.getRepository(AttemptAnswerOptionEntity).save(
          scoredAnswer.selectedOptionIds.map((questionOptionId) => ({
            attemptAnswerId: answer.id,
            questionOptionId,
          })),
        );
      }

      let certificate: CertificateEntity | null = null;
      if (scored.passed) {
        enrollment.status = EnrollmentStatus.PASSED;
        enrollment.passedAt = now;
        const expiresAt = new Date(
          now.getTime() + enrollment.course.certificateValidityDays * 86400000,
        );
        certificate = await manager.getRepository(CertificateEntity).save({
          certificateNumber: `CERT-${randomUUID().toUpperCase()}`,
          employeeId: enrollment.employeeId,
          courseId: enrollment.courseId,
          enrollmentId: enrollment.id,
          issuedAt: now,
          expiresAt,
        });
      } else if (existingCount + 1 === 3) {
        enrollment.status = EnrollmentStatus.REENROLLMENT_REQUIRED;
      }
      await manager.getRepository(EnrollmentEntity).save(enrollment);

      if (scored.passed && enrollment.learningPathEnrollmentId) {
        const outstanding = await manager.query<{ count: string }[]>(
          `
            SELECT COUNT(*)::text AS count
            FROM learning_path_courses path_course
            JOIN learning_path_enrollments path_enrollment
              ON path_enrollment.learning_path_id = path_course.learning_path_id
            WHERE path_enrollment.id = $1::uuid
              AND NOT EXISTS (
                SELECT 1
                FROM enrollments passed_enrollment
                WHERE passed_enrollment.employee_id = path_enrollment.employee_id
                  AND passed_enrollment.course_id = path_course.course_id
                  AND passed_enrollment.status = 'PASSED'
              )
          `,
          [enrollment.learningPathEnrollmentId],
        );
        if (Number(outstanding[0]?.count ?? 0) === 0) {
          await manager
            .getRepository(LearningPathEnrollmentEntity)
            .update(enrollment.learningPathEnrollmentId, {
              status: LearningPathEnrollmentStatus.COMPLETED,
              completedAt: now,
            });
        }
      }

      return {
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        score: scored.score,
        passed: scored.passed,
        enrollmentStatus: enrollment.status,
        certificate,
      };
    });
  }

  async list(enrollmentId: string, user: AuthenticatedUser) {
    const enrollment = await this.dataSource
      .getRepository(EnrollmentEntity)
      .findOneBy({ id: enrollmentId });
    if (!enrollment) throw new NotFoundException('Enrollment not found.');
    if (
      user.role === UserRole.EMPLOYEE &&
      user.employeeId !== enrollment.employeeId
    )
      throw new ForbiddenException(
        'Employees may only view their own attempts.',
      );
    return this.dataSource.getRepository(AssessmentAttemptEntity).find({
      where: { enrollmentId },
      order: { attemptNumber: 'ASC' },
    });
  }
}
