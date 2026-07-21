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
import { Roles } from '../../auth/decorators/roles/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity/user.entity';
import {
  CreateCourseModuleDto,
  UpdateCourseModuleDto,
} from '../dto/course.dto/course.dto';
import { ModulesService } from './modules.service';

@ApiTags('Courses')
@ApiBearerAuth('access-token')
@Controller()
export class ModulesController {
  constructor(private readonly modules: ModulesService) {}

  @Post('courses/:courseId/modules')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Add a module to a course',
    operationId: 'createCourseModule',
  })
  create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateCourseModuleDto,
  ) {
    return this.modules.create(courseId, dto);
  }

  @Get('courses/:courseId/modules')
  @ApiOperation({
    summary: 'List course modules',
    operationId: 'listCourseModules',
  })
  list(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.modules.list(courseId);
  }

  @Get('courses/:courseId/modules/:moduleId')
  @ApiOperation({
    summary: 'Get a course module',
    operationId: 'getCourseModule',
  })
  get(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('moduleId', ParseUUIDPipe) id: string,
  ) {
    return this.modules.get(courseId, id);
  }

  @Patch('courses/:courseId/modules/:moduleId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Update a course module',
    operationId: 'updateCourseModule',
  })
  update(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('moduleId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseModuleDto,
  ) {
    return this.modules.update(courseId, id, dto);
  }

  @Delete('courses/:courseId/modules/:moduleId')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Delete an unused course module',
    operationId: 'deleteCourseModule',
  })
  remove(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('moduleId', ParseUUIDPipe) id: string,
  ) {
    return this.modules.remove(courseId, id);
  }
}
