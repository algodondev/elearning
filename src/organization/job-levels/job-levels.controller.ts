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
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity/user.entity';
import {
  CreateJobLevelDto,
  ListJobLevelsDto,
  UpdateJobLevelDto,
} from '../dto/organization.dto/organization.dto';
import { JobLevelsService } from './job-levels.service';

@ApiTags('Organization')
@ApiBearerAuth('access-token')
@Controller('job-levels')
export class JobLevelsController {
  constructor(private readonly levels: JobLevelsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Create a job level',
    operationId: 'createJobLevel',
  })
  create(@Body() dto: CreateJobLevelDto) {
    return this.levels.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List job levels', operationId: 'listJobLevels' })
  list(@Query() query: ListJobLevelsDto) {
    return this.levels.list(query);
  }

  @Get(':jobLevelId')
  @ApiOperation({ summary: 'Get a job level', operationId: 'getJobLevel' })
  get(@Param('jobLevelId', ParseUUIDPipe) id: string) {
    return this.levels.get(id);
  }

  @Patch(':jobLevelId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Update a job level',
    operationId: 'updateJobLevel',
  })
  update(
    @Param('jobLevelId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobLevelDto,
  ) {
    return this.levels.update(id, dto);
  }

  @Delete(':jobLevelId')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Archive a job level',
    operationId: 'archiveJobLevel',
  })
  @ApiNoContentResponse()
  archive(@Param('jobLevelId', ParseUUIDPipe) id: string) {
    return this.levels.archive(id);
  }
}
