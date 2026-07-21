import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
  CreateEmployeeDto,
  ListEmployeesDto,
  UpdateEmployeeDto,
} from './dto/employee.dto/employee.dto';
import { EmployeesService } from './employees.service';

@ApiTags('Employees')
@ApiBearerAuth('access-token')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Create an employee and login account',
    operationId: 'createEmployee',
  })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employees.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: 'List employees', operationId: 'listEmployees' })
  list(@Query() query: ListEmployeesDto) {
    return this.employees.list(query);
  }

  @Get(':employeeId')
  @ApiOperation({ summary: 'Get an employee', operationId: 'getEmployee' })
  get(
    @Param('employeeId', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertAccess(user, id);
    return this.employees.get(id);
  }

  @Patch(':employeeId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Update an employee',
    operationId: 'updateEmployee',
  })
  update(
    @Param('employeeId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employees.update(id, dto);
  }

  @Delete(':employeeId')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Deactivate an employee',
    operationId: 'deactivateEmployee',
  })
  deactivate(@Param('employeeId', ParseUUIDPipe) id: string) {
    return this.employees.deactivate(id);
  }

  private assertAccess(user: AuthenticatedUser, employeeId: string) {
    if (user.role === UserRole.EMPLOYEE && user.employeeId !== employeeId) {
      throw new ForbiddenException(
        'Employees may only access their own profile.',
      );
    }
  }
}
