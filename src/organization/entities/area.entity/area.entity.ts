import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import { EmployeeEntity } from '../../../employees/entities/employee.entity/employee.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';

@Entity({ name: 'areas' })
export class AreaEntity extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ length: 120 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => EmployeeEntity, (employee) => employee.area)
  employees?: EmployeeEntity[];
}
