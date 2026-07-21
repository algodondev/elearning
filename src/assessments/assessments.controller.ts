import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user/current-user.decorator';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { UserRole } from '../auth/entities/user.entity/user.entity';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy/jwt.strategy';
import { AssessmentsService } from './assessments.service';
import { AttemptsService } from './attempts/attempts.service';
import {
  CreateAssessmentDto,
  CreateQuestionDto,
  SubmitAttemptDto,
  UpdateAssessmentDto,
  UpdateQuestionDto,
} from './dto/assessment.dto/assessment.dto';

@ApiTags('Assessments')
@ApiBearerAuth('access-token')
@Controller()
export class AssessmentsController {
  constructor(
    private readonly assessments: AssessmentsService,
    private readonly attempts: AttemptsService,
  ) {}

  @Post('courses/:courseId/assessments')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Create a draft assessment version',
    operationId: 'createAssessment',
  })
  create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateAssessmentDto,
  ) {
    return this.assessments.create(courseId, dto);
  }

  @Get('courses/:courseId/assessments/current')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Get the current administrative assessment',
    operationId: 'getCurrentAssessment',
  })
  current(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.assessments.current(courseId);
  }

  @Patch('assessments/:assessmentId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Update a draft assessment',
    operationId: 'updateAssessment',
  })
  update(
    @Param('assessmentId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssessmentDto,
  ) {
    return this.assessments.update(id, dto);
  }

  @Post('assessments/:assessmentId/publish')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Publish a valid assessment',
    operationId: 'publishAssessment',
  })
  publish(@Param('assessmentId', ParseUUIDPipe) id: string) {
    return this.assessments.publish(id);
  }

  @Post('assessments/:assessmentId/questions')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Add a question and its options',
    operationId: 'createAssessmentQuestion',
  })
  addQuestion(
    @Param('assessmentId', ParseUUIDPipe) id: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.assessments.addQuestion(id, dto);
  }

  @Get('assessments/:assessmentId/questions')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'List administrative question bank',
    operationId: 'listAssessmentQuestions',
  })
  listQuestions(@Param('assessmentId', ParseUUIDPipe) id: string) {
    return this.assessments.listQuestions(id);
  }

  @Get('assessments/:assessmentId/questions/:questionId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Get an administrative question',
    operationId: 'getAssessmentQuestion',
  })
  getQuestion(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Param('questionId', ParseUUIDPipe) id: string,
  ) {
    return this.assessments.getQuestion(assessmentId, id);
  }

  @Patch('assessments/:assessmentId/questions/:questionId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Update a draft question',
    operationId: 'updateAssessmentQuestion',
  })
  updateQuestion(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Param('questionId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.assessments.updateQuestion(assessmentId, id, dto);
  }

  @Delete('assessments/:assessmentId/questions/:questionId')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Delete an unused draft question',
    operationId: 'deleteAssessmentQuestion',
  })
  removeQuestion(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Param('questionId', ParseUUIDPipe) id: string,
  ) {
    return this.assessments.removeQuestion(assessmentId, id);
  }

  @Get('enrollments/:enrollmentId/assessment')
  @ApiOperation({
    summary: 'Get an assessment without answer keys',
    operationId: 'getEnrollmentAssessment',
  })
  publicAssessment(
    @Param('enrollmentId', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assessments.publicForEnrollment(id, user);
  }

  @Post('enrollments/:enrollmentId/assessment-attempts')
  @ApiOperation({
    summary: 'Submit a scored attempt after completing required modules',
    description:
      'A maximum of three attempts is allowed. The third failure requires re-enrollment.',
    operationId: 'submitAssessmentAttempt',
  })
  submit(
    @Param('enrollmentId', ParseUUIDPipe) id: string,
    @Body() dto: SubmitAttemptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attempts.submit(id, dto, user);
  }

  @Get('enrollments/:enrollmentId/assessment-attempts')
  @ApiOperation({
    summary: 'List enrollment attempt results',
    operationId: 'listAssessmentAttempts',
  })
  listAttempts(
    @Param('enrollmentId', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attempts.list(id, user);
  }
}
