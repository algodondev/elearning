import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../auth/entities/user.entity/user.entity';
import {
  EnrollmentEntity,
  EnrollmentStatus,
} from '../../enrollments/entities/enrollment.entity/enrollment.entity';
import { AssessmentAttemptEntity } from '../entities/assessment-attempt.entity/assessment-attempt.entity';
import { AssessmentEntity } from '../entities/assessment.entity/assessment.entity';
import { AttemptsService } from './attempts.service';

describe('AttemptsService preconditions and access', () => {
  const user = {
    sub: 'user-1',
    role: UserRole.EMPLOYEE,
    employeeId: 'employee-1',
    email: 'learner@example.com',
  };

  const build = () => {
    const enrollmentRepository = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
    };
    const assessmentRepository = { findOne: jest.fn() };
    const attemptRepository = {
      countBy: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === EnrollmentEntity) return enrollmentRepository;
        if (entity === AssessmentEntity) return assessmentRepository;
        if (entity === AssessmentAttemptEntity) return attemptRepository;
        throw new Error('Unexpected repository');
      }),
    };
    const dataSource = {
      transaction: jest.fn((_isolation, work) => work(manager)),
      getRepository: manager.getRepository,
    };
    const scoring = { score: jest.fn() };
    const service = new AttemptsService(dataSource as never, scoring as never, {
      now: () => new Date('2026-07-20T00:00:00.000Z'),
    });
    return {
      service,
      enrollmentRepository,
      assessmentRepository,
      attemptRepository,
      scoring,
    };
  };

  const submit = (service: AttemptsService) =>
    service.submit('enrollment-1', { answers: [] }, user);

  it('rejects a missing enrollment while taking the transaction lock', async () => {
    const { service, enrollmentRepository } = build();
    enrollmentRepository.findOne.mockResolvedValue(null);

    await expect(submit(service)).rejects.toBeInstanceOf(NotFoundException);
    expect(enrollmentRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
  });

  it('handles an enrollment disappearing after the lock lookup', async () => {
    const { service, enrollmentRepository } = build();
    enrollmentRepository.findOne
      .mockResolvedValueOnce({ id: 'enrollment-1' })
      .mockResolvedValueOnce(null);

    await expect(submit(service)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an employee submitting another employee enrollment', async () => {
    const { service, enrollmentRepository } = build();
    enrollmentRepository.findOne
      .mockResolvedValueOnce({ id: 'enrollment-1' })
      .mockResolvedValueOnce({ employeeId: 'other' });

    await expect(submit(service)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a ready enrollment when no assessment is published', async () => {
    const {
      service,
      enrollmentRepository,
      assessmentRepository,
      attemptRepository,
    } = build();
    enrollmentRepository.findOne
      .mockResolvedValueOnce({ id: 'enrollment-1' })
      .mockResolvedValueOnce({
        employeeId: 'employee-1',
        status: EnrollmentStatus.READY_FOR_ASSESSMENT,
        moduleProgress: [],
      });
    attemptRepository.countBy.mockResolvedValue(0);
    assessmentRepository.findOne.mockResolvedValue(null);

    await expect(submit(service)).rejects.toMatchObject({ status: 409 });
  });

  it('tolerates unloaded progress/options and ignores inactive questions', async () => {
    const {
      service,
      enrollmentRepository,
      assessmentRepository,
      attemptRepository,
      scoring,
    } = build();
    const enrollment = {
      id: 'enrollment-1',
      employeeId: 'employee-1',
      courseId: 'course-1',
      status: EnrollmentStatus.READY_FOR_ASSESSMENT,
      moduleProgress: undefined,
      learningPathEnrollmentId: null,
    };
    enrollmentRepository.findOne.mockResolvedValue(enrollment);
    attemptRepository.countBy.mockResolvedValue(0);
    assessmentRepository.findOne
      .mockResolvedValueOnce({
        id: 'assessment-1',
        passingScore: 70,
        questions: [
          {
            id: 'active-question',
            isActive: true,
            questionType: 'SINGLE_CHOICE',
            points: 10,
            options: undefined,
          },
          {
            id: 'inactive-question',
            isActive: false,
            questionType: 'SINGLE_CHOICE',
            points: 10,
            options: [],
          },
        ],
      })
      .mockResolvedValueOnce({
        id: 'assessment-1',
        passingScore: 70,
        questions: undefined,
      });
    scoring.score.mockReturnValue({
      totalPoints: 10,
      awardedPoints: 0,
      score: 0,
      passed: false,
      answers: [],
    });
    attemptRepository.save.mockResolvedValue({
      id: 'attempt-1',
      attemptNumber: 1,
    });
    enrollmentRepository.save.mockResolvedValue(enrollment);

    await expect(submit(service)).resolves.toMatchObject({
      id: 'attempt-1',
      passed: false,
      certificate: null,
    });
    expect(scoring.score).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 'active-question', options: [] })],
      [],
      70,
    );

    await submit(service);
    expect(scoring.score).toHaveBeenLastCalledWith([], [], 70);
  });

  it('lists attempts in order for an owner or privileged user', async () => {
    const { service, enrollmentRepository, attemptRepository } = build();
    enrollmentRepository.findOneBy.mockResolvedValue({
      employeeId: 'employee-1',
    });
    attemptRepository.find.mockResolvedValue([{ attemptNumber: 1 }]);

    await expect(service.list('enrollment-1', user)).resolves.toEqual([
      { attemptNumber: 1 },
    ]);
    expect(attemptRepository.find).toHaveBeenCalledWith({
      where: { enrollmentId: 'enrollment-1' },
      order: { attemptNumber: 'ASC' },
    });

    await expect(
      service.list('enrollment-1', {
        ...user,
        role: UserRole.HR_MANAGER,
        employeeId: undefined,
      }),
    ).resolves.toHaveLength(1);
  });

  it('rejects listing a missing or foreign enrollment', async () => {
    const { service, enrollmentRepository } = build();
    enrollmentRepository.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ employeeId: 'other' });

    await expect(service.list('missing', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.list('enrollment-1', user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
