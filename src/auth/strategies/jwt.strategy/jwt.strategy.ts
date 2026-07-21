import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '../../entities/user.entity/user.entity';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  employeeId?: string;
}

export interface AuthenticatedUser extends JwtPayload {
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.users.findOne({
      where: { id: payload.sub },
      relations: { employee: true },
    });
    if (!user?.isActive || (user.employee && !user.employee.isActive)) {
      throw new UnauthorizedException('Authentication is no longer valid.');
    }
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id,
    };
  }
}
