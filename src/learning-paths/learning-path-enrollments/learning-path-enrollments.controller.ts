import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user/current-user.decorator';
import { Roles } from '../../auth/decorators/roles/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity/user.entity';
import type { AuthenticatedUser } from '../../auth/strategies/jwt.strategy/jwt.strategy';
import {
  AssignLearningPathDto,
  ListLearningPathEnrollmentsDto,
} from '../dto/learning-path.dto/learning-path.dto';
import { LearningPathEnrollmentsService } from './learning-path-enrollments.service';

@ApiTags('Learning path assignments')
@ApiBearerAuth('access-token')
@Controller('learning-path-enrollments')
export class LearningPathEnrollmentsController {
  constructor(private readonly assignments: LearningPathEnrollmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Assign a published learning path to an active employee',
    operationId: 'assignLearningPath',
  })
  assign(@Body() dto: AssignLearningPathDto) {
    return this.assignments.assign(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List permitted learning path assignments',
    operationId: 'listLearningPathAssignments',
  })
  list(
    @Query() query: ListLearningPathEnrollmentsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignments.list(query, user);
  }

  @Get(':pathEnrollmentId')
  @ApiOperation({
    summary: 'Get path progress and sequential course states',
    operationId: 'getLearningPathAssignment',
  })
  get(
    @Param('pathEnrollmentId', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignments.get(id, user);
  }

  @Post(':pathEnrollmentId/courses/:courseId/enroll')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Enroll in an unlocked path course',
    description:
      'The first course is unlocked. Every later course requires a historical PASSED enrollment for the immediately previous course.',
    operationId: 'enrollLearningPathCourse',
  })
  enrollCourse(
    @Param('pathEnrollmentId', ParseUUIDPipe) assignmentId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignments.enrollCourse(assignmentId, courseId, user);
  }
}
