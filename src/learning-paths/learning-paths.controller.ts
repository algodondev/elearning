import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles/roles.decorator';
import { UserRole } from '../auth/entities/user.entity/user.entity';
import { PaginationQueryDto } from '../common/dto/pagination.dto/pagination.dto';
import {
  AddLearningPathCourseDto,
  CreateLearningPathDto,
  ReorderLearningPathCourseDto,
  UpdateLearningPathDto,
} from './dto/learning-path.dto/learning-path.dto';
import { LearningPathsService } from './learning-paths.service';

@ApiTags('Learning paths')
@ApiBearerAuth('access-token')
@Controller('learning-paths')
export class LearningPathsController {
  constructor(private readonly paths: LearningPathsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Create a draft learning path',
    operationId: 'createLearningPath',
  })
  create(@Body() dto: CreateLearningPathDto) {
    return this.paths.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List learning paths',
    operationId: 'listLearningPaths',
  })
  list(@Query() query: PaginationQueryDto) {
    return this.paths.list(query);
  }

  @Get(':learningPathId')
  @ApiOperation({
    summary: 'Get an ordered learning path',
    operationId: 'getLearningPath',
  })
  get(@Param('learningPathId', ParseUUIDPipe) id: string) {
    return this.paths.get(id);
  }

  @Patch(':learningPathId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Update learning path metadata',
    operationId: 'updateLearningPath',
  })
  update(
    @Param('learningPathId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLearningPathDto,
  ) {
    return this.paths.update(id, dto);
  }

  @Post(':learningPathId/publish')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Publish a non-empty learning path',
    operationId: 'publishLearningPath',
  })
  publish(@Param('learningPathId', ParseUUIDPipe) id: string) {
    return this.paths.publish(id);
  }

  @Delete(':learningPathId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Archive an unused learning path',
    operationId: 'archiveLearningPath',
  })
  archive(@Param('learningPathId', ParseUUIDPipe) id: string) {
    return this.paths.archive(id);
  }

  @Post(':learningPathId/courses')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Add a published course to a draft path',
    operationId: 'addLearningPathCourse',
  })
  addCourse(
    @Param('learningPathId', ParseUUIDPipe) id: string,
    @Body() dto: AddLearningPathCourseDto,
  ) {
    return this.paths.addCourse(id, dto);
  }

  @Patch(':learningPathId/courses/:courseId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Reorder a course before first assignment',
    operationId: 'reorderLearningPathCourse',
  })
  reorderCourse(
    @Param('learningPathId', ParseUUIDPipe) pathId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: ReorderLearningPathCourseDto,
  ) {
    return this.paths.reorder(pathId, courseId, dto);
  }

  @Delete(':learningPathId/courses/:courseId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Remove a course before first assignment',
    operationId: 'removeLearningPathCourse',
  })
  removeCourse(
    @Param('learningPathId', ParseUUIDPipe) pathId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.paths.removeCourse(pathId, courseId);
  }
}
