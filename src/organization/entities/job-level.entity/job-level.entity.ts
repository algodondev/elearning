import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import { EmployeeEntity } from '../../../employees/entities/employee.entity/employee.entity';
import { Check, Column, Entity, Index, OneToMany } from 'typeorm';

@Entity({ name: 'job_levels' })
@Check('CHK_job_levels_rank_positive', 'rank_order > 0')
export class JobLevelEntity extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ length: 120 })
  name!: string;

  @Index({ unique: true })
  @Column({ name: 'rank_order', type: 'integer' })
  rankOrder!: number;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => EmployeeEntity, (employee) => employee.jobLevel)
  employees?: EmployeeEntity[];
}
