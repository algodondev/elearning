import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcrypt';
import { Repository } from 'typeorm';
import { LoginDto, LoginResponseDto } from './dto/auth.dto/auth.dto';
import { UserEntity } from './entities/user.entity/user.entity';
import { AuthenticatedUser } from './strategies/jwt.strategy/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.employee', 'employee')
      .where('user.email = :email', { email: dto.email.toLowerCase() })
      .getOne();

    const valid = user && (await compare(dto.password, user.passwordHash));
    if (
      !valid ||
      !user.isActive ||
      (user.employee && !user.employee.isActive)
    ) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    user.lastLoginAt = new Date();
    await this.users.save(user);
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '15m');
    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        role: user.role,
        employeeId: user.employee?.id,
      },
      { expiresIn: expiresIn as never },
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employee?.id,
      },
    };
  }

  async profile(authenticated: AuthenticatedUser) {
    const user = await this.users.findOneOrFail({
      where: { id: authenticated.sub },
      relations: { employee: { area: true, jobLevel: true } },
    });
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeCode: user.employee.employeeCode,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            area: user.employee.area,
            jobLevel: user.employee.jobLevel,
          }
        : null,
    };
  }
}
