import { AppBaseEntity } from '../../../common/entities/base.entity/base.entity';
import { CourseEntity } from '../../../courses/entities/course.entity/course.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { LearningPathEntity } from '../learning-path.entity/learning-path.entity';

@Entity({ name: 'learning_path_courses' })
@Unique('UQ_learning_path_course', ['learningPathId', 'courseId'])
@Unique('UQ_learning_path_sequence', ['learningPathId', 'sequenceNumber'])
@Check('CHK_learning_path_sequence_positive', 'sequence_number > 0')
export class LearningPathCourseEntity extends AppBaseEntity {
  @Index()
  @Column({ name: 'learning_path_id', type: 'uuid' })
  learningPathId!: string;

  @ManyToOne(() => LearningPathEntity, (path) => path.courses, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'learning_path_id' })
  learningPath!: LearningPathEntity;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @ManyToOne(() => CourseEntity, (course) => course.learningPathCourses, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'course_id' })
  course!: CourseEntity;

  @Column({ name: 'sequence_number', type: 'integer' })
  sequenceNumber!: number;
}
