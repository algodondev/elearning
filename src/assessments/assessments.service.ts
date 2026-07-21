import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../auth/entities/user.entity/user.entity';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy/jwt.strategy';
import { CourseEntity } from '../courses/entities/course.entity/course.entity';
import { EnrollmentEntity } from '../enrollments/entities/enrollment.entity/enrollment.entity';
import {
  CreateAssessmentDto,
  CreateQuestionDto,
  UpdateAssessmentDto,
  UpdateQuestionDto,
} from './dto/assessment.dto/assessment.dto';
import {
  AssessmentEntity,
  AssessmentStatus,
} from './entities/assessment.entity/assessment.entity';
import { QuestionOptionEntity } from './entities/question-option.entity/question-option.entity';
import {
  QuestionEntity,
  QuestionType,
} from './entities/question.entity/question.entity';

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(AssessmentEntity)
    private readonly assessments: Repository<AssessmentEntity>,
    @InjectRepository(QuestionEntity)
    private readonly questions: Repository<QuestionEntity>,
    @InjectRepository(CourseEntity)
    private readonly courses: Repository<CourseEntity>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollments: Repository<EnrollmentEntity>,
  ) {}

  async create(courseId: string, dto: CreateAssessmentDto) {
    if (!(await this.courses.existsBy({ id: courseId })))
      throw new NotFoundException('Course not found.');
    const row = await this.assessments
      .createQueryBuilder('assessment')
      .select('MAX(assessment.version)', 'max')
      .where('assessment.courseId = :courseId', { courseId })
      .getRawOne<{ max: string | null }>();
    return this.assessments.save(
      this.assessments.create({
        ...dto,
        instructions: dto.instructions ?? null,
        courseId,
        version: Number(row?.max ?? 0) + 1,
        status: AssessmentStatus.DRAFT,
        publishedAt: null,
      }),
    );
  }

  async current(courseId: string) {
    const assessment = await this.assessments.findOne({
      where: { courseId, status: AssessmentStatus.PUBLISHED },
      relations: { questions: { options: true } },
      order: {
        questions: {
          sequenceNumber: 'ASC',
          options: { sequenceNumber: 'ASC' },
        },
      },
    });
    if (!assessment)
      throw new NotFoundException('Published assessment not found.');
    return assessment;
  }

  async get(id: string) {
    const assessment = await this.assessments.findOne({
      where: { id },
      relations: { questions: { options: true } },
      order: {
        questions: {
          sequenceNumber: 'ASC',
          options: { sequenceNumber: 'ASC' },
        },
      },
    });
    if (!assessment) throw new NotFoundException('Assessment not found.');
    return assessment;
  }

  async update(id: string, dto: UpdateAssessmentDto) {
    const assessment = await this.assertEditable(id);
    Object.assign(assessment, dto);
    return this.assessments.save(assessment);
  }

  async addQuestion(assessmentId: string, dto: CreateQuestionDto) {
    await this.assertEditable(assessmentId);
    this.validateQuestion(dto);
    const id = await this.dataSource.transaction(async (manager) => {
      const question = await manager.getRepository(QuestionEntity).save({
        assessmentId,
        prompt: dto.prompt,
        questionType: dto.questionType,
        points: dto.points,
        sequenceNumber: dto.sequenceNumber,
        isActive: true,
      });
      const options = dto.options.map((option) =>
        manager
          .getRepository(QuestionOptionEntity)
          .create({ ...option, questionId: question.id }),
      );
      await manager.getRepository(QuestionOptionEntity).save(options);
      return question.id;
    });
    return this.getQuestion(assessmentId, id);
  }

  listQuestions(assessmentId: string) {
    return this.questions.find({
      where: { assessmentId },
      relations: { options: true },
      order: { sequenceNumber: 'ASC', options: { sequenceNumber: 'ASC' } },
    });
  }

  async getQuestion(assessmentId: string, id: string) {
    const question = await this.questions.findOne({
      where: { id, assessmentId },
      relations: { options: true },
      order: { options: { sequenceNumber: 'ASC' } },
    });
    if (!question)
      throw new NotFoundException('Assessment question not found.');
    return question;
  }

  async updateQuestion(
    assessmentId: string,
    id: string,
    dto: UpdateQuestionDto,
  ) {
    await this.assertEditable(assessmentId);
    const question = await this.getQuestion(assessmentId, id);
    const merged = {
      ...question,
      ...dto,
      options: dto.options ?? question.options ?? [],
    };
    this.validateQuestion(merged);
    await this.dataSource.transaction(async (manager) => {
      Object.assign(question, dto);
      await manager.getRepository(QuestionEntity).save(question);
      if (dto.options) {
        await manager
          .getRepository(QuestionOptionEntity)
          .delete({ questionId: id });
        await manager
          .getRepository(QuestionOptionEntity)
          .save(dto.options.map((option) => ({ ...option, questionId: id })));
      }
    });
    return this.getQuestion(assessmentId, id);
  }

  async removeQuestion(assessmentId: string, id: string): Promise<void> {
    await this.assertEditable(assessmentId);
    const question = await this.getQuestion(assessmentId, id);
    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(QuestionOptionEntity)
        .delete({ questionId: id });
      await manager.getRepository(QuestionEntity).remove(question);
    });
  }

  async publish(id: string) {
    const assessment = await this.assertEditable(id);
    const questions = await this.listQuestions(id);
    if (
      !questions.length ||
      questions.reduce((sum, question) => sum + Number(question.points), 0) <= 0
    ) {
      throw new ConflictException({
        code: 'ASSESSMENT_NOT_PUBLISHABLE',
        message: 'Assessment needs valid questions and points.',
      });
    }
    for (const question of questions)
      this.validateQuestion({
        ...question,
        options: question.options ?? [],
      });
    await this.assessments.update(
      { courseId: assessment.courseId, status: AssessmentStatus.PUBLISHED },
      { status: AssessmentStatus.RETIRED },
    );
    assessment.status = AssessmentStatus.PUBLISHED;
    assessment.publishedAt = new Date();
    return this.assessments.save(assessment);
  }

  async publicForEnrollment(enrollmentId: string, user: AuthenticatedUser) {
    const enrollment = await this.enrollments.findOneBy({ id: enrollmentId });
    if (!enrollment) throw new NotFoundException('Enrollment not found.');
    if (
      user.role === UserRole.EMPLOYEE &&
      user.employeeId !== enrollment.employeeId
    )
      throw new ConflictException(
        'Enrollment does not belong to the authenticated employee.',
      );
    const assessment = await this.current(enrollment.courseId);
    return {
      id: assessment.id,
      title: assessment.title,
      instructions: assessment.instructions,
      passingScore: Number(assessment.passingScore),
      questions: (assessment.questions ?? []).map((question) => ({
        id: question.id,
        prompt: question.prompt,
        questionType: question.questionType,
        points: Number(question.points),
        sequenceNumber: question.sequenceNumber,
        options: (question.options ?? []).map((option) => ({
          id: option.id,
          optionText: option.optionText,
          sequenceNumber: option.sequenceNumber,
        })),
      })),
    };
  }

  private async assertEditable(id: string) {
    const assessment = await this.assessments.findOneBy({ id });
    if (!assessment) throw new NotFoundException('Assessment not found.');
    if (assessment.status !== AssessmentStatus.DRAFT)
      throw new ConflictException({
        code: 'ASSESSMENT_LOCKED',
        message: 'Only draft assessments can be edited.',
      });
    return assessment;
  }

  private validateQuestion(dto: CreateQuestionDto) {
    const correct = dto.options.filter((option) => option.isCorrect).length;
    const uniqueSequence = new Set(
      dto.options.map((option) => option.sequenceNumber),
    );
    const valid =
      uniqueSequence.size === dto.options.length &&
      ((dto.questionType === QuestionType.SINGLE_CHOICE && correct === 1) ||
        (dto.questionType === QuestionType.TRUE_FALSE &&
          dto.options.length === 2 &&
          correct === 1) ||
        (dto.questionType === QuestionType.MULTIPLE_CHOICE && correct >= 1));
    if (!valid)
      throw new BadRequestException({
        code: 'INVALID_QUESTION_OPTIONS',
        message: 'Question options do not match the question type.',
      });
  }
}
