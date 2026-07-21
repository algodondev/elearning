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
  CreateModuleContentDto,
  UpdateModuleContentDto,
} from '../dto/course.dto/course.dto';
import { ContentsService } from './contents.service';

@ApiTags('Courses')
@ApiBearerAuth('access-token')
@Controller()
export class ContentsController {
  constructor(private readonly contents: ContentsService) {}

  @Post('modules/:moduleId/contents')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Add module content',
    operationId: 'createModuleContent',
  })
  create(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: CreateModuleContentDto,
  ) {
    return this.contents.create(moduleId, dto);
  }

  @Get('modules/:moduleId/contents')
  @ApiOperation({
    summary: 'List module contents',
    operationId: 'listModuleContents',
  })
  list(@Param('moduleId', ParseUUIDPipe) moduleId: string) {
    return this.contents.list(moduleId);
  }

  @Patch('modules/:moduleId/contents/:contentId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Update module content',
    operationId: 'updateModuleContent',
  })
  update(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Param('contentId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModuleContentDto,
  ) {
    return this.contents.update(moduleId, id, dto);
  }

  @Delete('modules/:moduleId/contents/:contentId')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Delete unused module content',
    operationId: 'deleteModuleContent',
  })
  remove(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Param('contentId', ParseUUIDPipe) id: string,
  ) {
    return this.contents.remove(moduleId, id);
  }
}
