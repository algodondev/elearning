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
  CreateAreaDto,
  ListAreasDto,
  UpdateAreaDto,
} from '../dto/organization.dto/organization.dto';
import { AreasService } from './areas.service';

@ApiTags('Organization')
@ApiBearerAuth('access-token')
@Controller('areas')
export class AreasController {
  constructor(private readonly areas: AreasService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Create an organizational area',
    operationId: 'createArea',
  })
  create(@Body() dto: CreateAreaDto) {
    return this.areas.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List organizational areas',
    operationId: 'listAreas',
  })
  list(@Query() query: ListAreasDto) {
    return this.areas.list(query);
  }

  @Get(':areaId')
  @ApiOperation({
    summary: 'Get an organizational area',
    operationId: 'getArea',
  })
  get(@Param('areaId', ParseUUIDPipe) id: string) {
    return this.areas.get(id);
  }

  @Patch(':areaId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Update an organizational area',
    operationId: 'updateArea',
  })
  update(
    @Param('areaId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAreaDto,
  ) {
    return this.areas.update(id, dto);
  }

  @Delete(':areaId')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Archive an organizational area',
    operationId: 'archiveArea',
  })
  @ApiNoContentResponse()
  archive(@Param('areaId', ParseUUIDPipe) id: string) {
    return this.areas.archive(id);
  }
}
