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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user/current-user.decorator';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { UserRole } from '../auth/entities/user.entity/user.entity';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy/jwt.strategy';
import {
  CreateCourseDto,
  ListCoursesDto,
  UpdateCourseDto,
} from './dto/course.dto/course.dto';
import { CoursesService } from './courses.service';

@ApiTags('Courses')
@ApiBearerAuth('access-token')
@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Create a draft course',
    operationId: 'createCourse',
  })
  create(@Body() dto: CreateCourseDto) {
    return this.courses.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List courses', operationId: 'listCourses' })
  list(@Query() query: ListCoursesDto, @CurrentUser() user: AuthenticatedUser) {
    return this.courses.list(query, user.role === UserRole.EMPLOYEE);
  }

  @Get(':courseId')
  @ApiOperation({
    summary: 'Get a course with ordered structure',
    operationId: 'getCourse',
  })
  get(@Param('courseId', ParseUUIDPipe) id: string) {
    return this.courses.get(id);
  }

  @Patch(':courseId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Update course metadata',
    operationId: 'updateCourse',
  })
  update(
    @Param('courseId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.courses.update(id, dto);
  }

  @Post(':courseId/publish')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Publish a complete course',
    operationId: 'publishCourse',
  })
  publish(@Param('courseId', ParseUUIDPipe) id: string) {
    return this.courses.publish(id);
  }

  @Delete(':courseId')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: 'Archive a course', operationId: 'archiveCourse' })
  archive(@Param('courseId', ParseUUIDPipe) id: string) {
    return this.courses.archive(id);
  }
}
