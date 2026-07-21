import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from './decorators/current-user/current-user.decorator';
import { Public } from './decorators/public/public.decorator';
import { LoginDto, LoginResponseDto } from './dto/auth.dto/auth.dto';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './strategies/jwt.strategy/jwt.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Authenticate with email and password',
    operationId: 'authLogin',
  })
  @ApiCreatedResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or inactive credentials.' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get the authenticated profile',
    operationId: 'authProfile',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT is missing, invalid, or expired.',
  })
  profile(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.profile(user);
  }
}
