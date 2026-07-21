import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../entities/user.entity/user.entity';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'AdminPass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class AuthUserDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'admin@example.com' }) email!: string;
  @ApiProperty({ enum: UserRole }) role!: UserRole;
  @ApiProperty({ format: 'uuid', required: false }) employeeId?: string;
}

export class LoginResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ example: 'Bearer' }) tokenType!: 'Bearer';
  @ApiProperty({ example: '15m' }) expiresIn!: string;
  @ApiProperty({ type: AuthUserDto }) user!: AuthUserDto;
}
