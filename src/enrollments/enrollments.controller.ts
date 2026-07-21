import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user/current-user.decorator';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { UserRole } from '../auth/entities/user.entity/user.entity';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy/jwt.strategy';
import {
  CreateEnrollmentDto,
  ListEnrollmentsDto,
} from './dto/enrollment.dto/enrollment.dto';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('Enrollments')
@ApiBearerAuth('access-token')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Enroll an employee and initialize module progress',
    operationId: 'createEnrollment',
  })
  create(@Body() dto: CreateEnrollmentDto) {
    return this.enrollments.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List permitted enrollments',
    operationId: 'listEnrollments',
  })
  list(
    @Query() query: ListEnrollmentsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.enrollments.list(query, user);
  }

  @Get(':enrollmentId')
  @ApiOperation({
    summary: 'Get enrollment progress, attempts, and certificate',
    operationId: 'getEnrollment',
  })
  get(
    @Param('enrollmentId', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.enrollments.get(id, user);
  }

  @Patch(':enrollmentId/cancel')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Cancel an active enrollment',
    operationId: 'cancelEnrollment',
  })
  cancel(@Param('enrollmentId', ParseUUIDPipe) id: string) {
    return this.enrollments.cancel(id);
  }

  @Post(':enrollmentId/modules/:moduleId/complete')
  @ApiOperation({
    summary: 'Complete an owned enrollment module idempotently',
    operationId: 'completeEnrollmentModule',
  })
  complete(
    @Param('enrollmentId', ParseUUIDPipe) id: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.enrollments.completeModule(id, moduleId, user);
  }

  @Post(':enrollmentId/re-enroll')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Re-enroll after the third failed attempt',
    operationId: 'reEnroll',
  })
  reEnroll(@Param('enrollmentId', ParseUUIDPipe) id: string) {
    return this.enrollments.reEnroll(id);
  }
}
