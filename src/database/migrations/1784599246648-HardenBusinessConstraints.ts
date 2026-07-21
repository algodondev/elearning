import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenBusinessConstraints1784599246648 implements MigrationInterface {
  name = 'HardenBusinessConstraints1784599246648';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_email_ci" ON "users" (LOWER("email"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_areas_name_ci" ON "areas" (LOWER("name"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_job_levels_name_ci" ON "job_levels" (LOWER("name"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_employees_code_ci" ON "employees" (LOWER("employee_code"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_courses_code_ci" ON "courses" (LOWER("code"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_learning_paths_name_ci" ON "learning_paths" (LOWER("name"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_enrollments_active_employee_course" ON "enrollments" ("employee_id", "course_id") WHERE "status" IN ('ENROLLED', 'IN_PROGRESS', 'READY_FOR_ASSESSMENT')`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_assessments_one_published_per_course" ON "assessments" ("course_id") WHERE "status" = 'PUBLISHED'`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "CHK_enrollments_learning_path_context" CHECK (("learning_path_enrollment_id" IS NULL AND "learning_path_course_id" IS NULL) OR ("learning_path_enrollment_id" IS NOT NULL AND "learning_path_course_id" IS NOT NULL))`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_contents" ADD CONSTRAINT "CHK_module_contents_payload" CHECK (("content_type" = 'TEXT' AND "body" IS NOT NULL AND "content_url" IS NULL) OR ("content_type" <> 'TEXT' AND "content_url" IS NOT NULL AND "body" IS NULL))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "module_contents" DROP CONSTRAINT "CHK_module_contents_payload"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "CHK_enrollments_learning_path_context"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_assessments_one_published_per_course"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_enrollments_active_employee_course"`,
    );
    await queryRunner.query(`DROP INDEX "public"."UQ_learning_paths_name_ci"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_courses_code_ci"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_employees_code_ci"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_job_levels_name_ci"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_areas_name_ci"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_users_email_ci"`);
  }
}
