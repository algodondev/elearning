import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import { EmployeeEntity } from '../../../employees/entities/employee.entity/employee.entity';
import { Column, Entity, Index, OneToOne } from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  HR_MANAGER = 'HR_MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

@Entity({ name: 'users' })
export class UserEntity extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ length: 320 })
  email!: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @OneToOne(() => EmployeeEntity, (employee) => employee.user)
  employee?: EmployeeEntity;
}
