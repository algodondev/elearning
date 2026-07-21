import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1784597307892 implements MigrationInterface {
  name = 'InitialSchema1784597307892';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "question_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "question_id" uuid NOT NULL, "option_text" text NOT NULL, "is_correct" boolean NOT NULL, "sequence_number" integer NOT NULL, CONSTRAINT "UQ_question_options_sequence" UNIQUE ("question_id", "sequence_number"), CONSTRAINT "CHK_question_options_sequence_positive" CHECK (sequence_number > 0), CONSTRAINT "PK_13be20e51c0738def32f00cf7d5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f0b7aaabd3f88e700daf0fe681" ON "question_options"  ("question_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "attempt_answer_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "attempt_answer_id" uuid NOT NULL, "question_option_id" uuid NOT NULL, CONSTRAINT "UQ_attempt_answer_selected_option" UNIQUE ("attempt_answer_id", "question_option_id"), CONSTRAINT "PK_31e2b76e74117541be1a7c9c79c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "attempt_answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "attempt_id" uuid NOT NULL, "question_id" uuid NOT NULL, "max_points_snapshot" numeric(8,2) NOT NULL, "awarded_points" numeric(8,2) NOT NULL, "is_correct" boolean NOT NULL, CONSTRAINT "UQ_attempt_answers_question" UNIQUE ("attempt_id", "question_id"), CONSTRAINT "PK_b5f6f0c32809f5b14da916e6f06" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."questions_question_type_enum" AS ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "assessment_id" uuid NOT NULL, "prompt" text NOT NULL, "question_type" "public"."questions_question_type_enum" NOT NULL, "points" numeric(8,2) NOT NULL, "sequence_number" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_questions_assessment_sequence" UNIQUE ("assessment_id", "sequence_number"), CONSTRAINT "CHK_questions_sequence_positive" CHECK (sequence_number > 0), CONSTRAINT "CHK_questions_points_positive" CHECK (points > 0), CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bce633b738e5ad4e54f90f9a46" ON "questions"  ("assessment_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."assessments_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'RETIRED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "assessments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "course_id" uuid NOT NULL, "version" integer NOT NULL, "title" character varying(200) NOT NULL, "instructions" text, "passing_score" numeric(5,2) NOT NULL, "status" "public"."assessments_status_enum" NOT NULL DEFAULT 'DRAFT', "published_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_assessments_course_version" UNIQUE ("course_id", "version"), CONSTRAINT "CHK_assessments_passing_score" CHECK (passing_score > 0 AND passing_score <= 100), CONSTRAINT "CHK_assessments_version_positive" CHECK (version > 0), CONSTRAINT "PK_a3442bd80a00e9111cefca57f6c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2d76c87300726d247589833f63" ON "assessments"  ("course_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'HR_MANAGER', 'EMPLOYEE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" character varying(320) NOT NULL, "password_hash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "last_login_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users"  ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "areas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(120) NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_5110493f6342f34c978c084d0d6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8c2ad80240e18fcac9e7c52631" ON "areas"  ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "job_levels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(120) NOT NULL, "rank_order" integer NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "CHK_job_levels_rank_positive" CHECK (rank_order > 0), CONSTRAINT "PK_86a4e88cf87968ed4bfc349eaa3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4a6c0938935e2a91dcce8ab71d" ON "job_levels"  ("name") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_dc1e008241ee7a27c86ec56bab" ON "job_levels"  ("rank_order") `,
    );
    await queryRunner.query(
      `CREATE TABLE "employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "employee_code" character varying(50) NOT NULL, "first_name" character varying(120) NOT NULL, "last_name" character varying(120) NOT NULL, "area_id" uuid NOT NULL, "job_level_id" uuid NOT NULL, "hire_date" date NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "REL_2d83c53c3e553a48dadb9722e3" UNIQUE ("user_id"), CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2d83c53c3e553a48dadb9722e3" ON "employees"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_56162b5f24af743a154680684f" ON "employees"  ("employee_code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_37fe5168e0e0d65295042d47ea" ON "employees"  ("area_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b1507ca50d9d279f752ceffc1c" ON "employees"  ("job_level_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_employees_area_active" ON "employees"  ("area_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."learning_path_enrollments_status_enum" AS ENUM('ACTIVE', 'COMPLETED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "learning_path_enrollments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "learning_path_id" uuid NOT NULL, "employee_id" uuid NOT NULL, "status" "public"."learning_path_enrollments_status_enum" NOT NULL, "enrolled_at" TIMESTAMP WITH TIME ZONE NOT NULL, "completed_at" TIMESTAMP WITH TIME ZONE, "cancelled_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_learning_path_employee" UNIQUE ("learning_path_id", "employee_id"), CONSTRAINT "PK_e10044379e5a097891ca07a236d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7d554a0392122dd3bd19a243ec" ON "learning_path_enrollments"  ("learning_path_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_741a8c589365053ab10c641bd5" ON "learning_path_enrollments"  ("employee_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."learning_paths_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "learning_paths" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(200) NOT NULL, "description" text, "status" "public"."learning_paths_status_enum" NOT NULL DEFAULT 'DRAFT', CONSTRAINT "PK_2f073530d2af4a865296c06274c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_72217dff97d718a5494d698f56" ON "learning_paths"  ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "learning_path_courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "learning_path_id" uuid NOT NULL, "course_id" uuid NOT NULL, "sequence_number" integer NOT NULL, CONSTRAINT "UQ_learning_path_sequence" UNIQUE ("learning_path_id", "sequence_number"), CONSTRAINT "UQ_learning_path_course" UNIQUE ("learning_path_id", "course_id"), CONSTRAINT "CHK_learning_path_sequence_positive" CHECK (sequence_number > 0), CONSTRAINT "PK_06334507c1725ed8062760c33a1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_68caef24fcbb3d4aeb46e85765" ON "learning_path_courses"  ("learning_path_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."module_progress_status_enum" AS ENUM('PENDING', 'COMPLETED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "module_progress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "enrollment_id" uuid NOT NULL, "module_id" uuid NOT NULL, "status" "public"."module_progress_status_enum" NOT NULL, "completed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_module_progress_enrollment_module" UNIQUE ("enrollment_id", "module_id"), CONSTRAINT "PK_29f00069652b2ea973d36e6db99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_module_progress_enrollment_status" ON "module_progress"  ("enrollment_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."module_contents_content_type_enum" AS ENUM('VIDEO', 'DOCUMENT', 'LINK', 'TEXT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "module_contents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "module_id" uuid NOT NULL, "title" character varying(200) NOT NULL, "content_type" "public"."module_contents_content_type_enum" NOT NULL, "content_url" text, "body" text, "sequence_number" integer NOT NULL, CONSTRAINT "UQ_module_contents_sequence" UNIQUE ("module_id", "sequence_number"), CONSTRAINT "CHK_module_contents_sequence_positive" CHECK (sequence_number > 0), CONSTRAINT "PK_46beb539ccebd1b4888f25c4705" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_beeaaccdbd4bbb592a39999764" ON "module_contents"  ("module_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "course_modules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "course_id" uuid NOT NULL, "title" character varying(200) NOT NULL, "description" text, "sequence_number" integer NOT NULL, "estimated_duration_minutes" integer NOT NULL, "is_required" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_course_modules_sequence" UNIQUE ("course_id", "sequence_number"), CONSTRAINT "CHK_course_modules_duration_positive" CHECK (estimated_duration_minutes > 0), CONSTRAINT "CHK_course_modules_sequence_positive" CHECK (sequence_number > 0), CONSTRAINT "PK_4c195db0718e8845a6e09075ebc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_81644557c2401f37fe9e884e88" ON "course_modules"  ("course_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."courses_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "code" character varying(50) NOT NULL, "title" character varying(200) NOT NULL, "description" text NOT NULL, "estimated_duration_minutes" integer NOT NULL, "is_mandatory" boolean NOT NULL DEFAULT false, "certificate_validity_days" integer NOT NULL, "status" "public"."courses_status_enum" NOT NULL DEFAULT 'DRAFT', CONSTRAINT "CHK_courses_validity_positive" CHECK (certificate_validity_days > 0), CONSTRAINT "CHK_courses_duration_positive" CHECK (estimated_duration_minutes > 0), CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_86b3589486bac01d2903e22471" ON "courses"  ("code") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."certificate_alerts_alert_type_enum" AS ENUM('EXPIRING_30_DAYS', 'EXPIRED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."certificate_alerts_status_enum" AS ENUM('PENDING', 'READ')`,
    );
    await queryRunner.query(
      `CREATE TABLE "certificate_alerts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "certificate_id" uuid NOT NULL, "employee_id" uuid NOT NULL, "alert_type" "public"."certificate_alerts_alert_type_enum" NOT NULL, "status" "public"."certificate_alerts_status_enum" NOT NULL DEFAULT 'PENDING', "alerted_at" TIMESTAMP WITH TIME ZONE NOT NULL, "read_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_certificate_alert_type" UNIQUE ("certificate_id", "alert_type"), CONSTRAINT "PK_ef412248c6124c6ea423469e0d1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_certificate_alerts_employee_status_type" ON "certificate_alerts"  ("employee_id", "status", "alert_type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "certificates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "certificate_number" character varying(80) NOT NULL, "employee_id" uuid NOT NULL, "course_id" uuid NOT NULL, "enrollment_id" uuid NOT NULL, "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "REL_f0f3773b2ccb7811da9ccd63d9" UNIQUE ("enrollment_id"), CONSTRAINT "CHK_certificates_expiry" CHECK (expires_at > issued_at), CONSTRAINT "PK_e4c7e31e2144300bea7d89eb165" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0387224f2281652909605da294" ON "certificates"  ("certificate_number") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f0f3773b2ccb7811da9ccd63d9" ON "certificates"  ("enrollment_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3a9806fe68cab7c101a5c344ae" ON "certificates"  ("expires_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_certificates_report" ON "certificates"  ("course_id", "employee_id", "expires_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."enrollments_status_enum" AS ENUM('ENROLLED', 'IN_PROGRESS', 'READY_FOR_ASSESSMENT', 'PASSED', 'REENROLLMENT_REQUIRED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "enrollments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "employee_id" uuid NOT NULL, "course_id" uuid NOT NULL, "status" "public"."enrollments_status_enum" NOT NULL, "learning_path_enrollment_id" uuid, "learning_path_course_id" uuid, "reenrollment_of_id" uuid, "enrolled_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ready_at" TIMESTAMP WITH TIME ZONE, "passed_at" TIMESTAMP WITH TIME ZONE, "cancelled_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "REL_8b995321a1612cd37be062e7ad" UNIQUE ("reenrollment_of_id"), CONSTRAINT "PK_7c0f752f9fb68bf6ed7367ab00f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8b995321a1612cd37be062e7ad" ON "enrollments"  ("reenrollment_of_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_enrollments_employee_course_status" ON "enrollments"  ("employee_id", "course_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "assessment_attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "enrollment_id" uuid NOT NULL, "assessment_id" uuid NOT NULL, "attempt_number" integer NOT NULL, "total_points" numeric(8,2) NOT NULL, "awarded_points" numeric(8,2) NOT NULL, "score" numeric(5,2) NOT NULL, "passing_score_snapshot" numeric(5,2) NOT NULL, "passed" boolean NOT NULL, "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_assessment_attempt_number" UNIQUE ("enrollment_id", "attempt_number"), CONSTRAINT "CHK_assessment_attempt_score" CHECK (score >= 0 AND score <= 100), CONSTRAINT "CHK_assessment_attempt_number" CHECK (attempt_number BETWEEN 1 AND 3), CONSTRAINT "PK_3761b6653b00f7df0ca4c1049ce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6863844211f35627a992fe1628" ON "assessment_attempts"  ("enrollment_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "question_options" ADD CONSTRAINT "FK_f0b7aaabd3f88e700daf0fe681c" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answer_options" ADD CONSTRAINT "FK_2f1e58272bc27d0e834faccf388" FOREIGN KEY ("attempt_answer_id") REFERENCES "attempt_answers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answer_options" ADD CONSTRAINT "FK_530490f1a5ac047da7a81658a8f" FOREIGN KEY ("question_option_id") REFERENCES "question_options"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answers" ADD CONSTRAINT "FK_32015c863766540050618a1165c" FOREIGN KEY ("attempt_id") REFERENCES "assessment_attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answers" ADD CONSTRAINT "FK_fff29b83c9965e08837b508f0cd" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_bce633b738e5ad4e54f90f9a461" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD CONSTRAINT "FK_2d76c87300726d247589833f63f" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD CONSTRAINT "FK_2d83c53c3e553a48dadb9722e38" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD CONSTRAINT "FK_37fe5168e0e0d65295042d47ea4" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD CONSTRAINT "FK_b1507ca50d9d279f752ceffc1c7" FOREIGN KEY ("job_level_id") REFERENCES "job_levels"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_path_enrollments" ADD CONSTRAINT "FK_7d554a0392122dd3bd19a243ec5" FOREIGN KEY ("learning_path_id") REFERENCES "learning_paths"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_path_enrollments" ADD CONSTRAINT "FK_741a8c589365053ab10c641bd57" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_path_courses" ADD CONSTRAINT "FK_68caef24fcbb3d4aeb46e857653" FOREIGN KEY ("learning_path_id") REFERENCES "learning_paths"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_path_courses" ADD CONSTRAINT "FK_d06e966a2d7fb6101d92b4a5f02" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_progress" ADD CONSTRAINT "FK_0a74a687b5ec47710e798b11294" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_progress" ADD CONSTRAINT "FK_f8100e4c38116de5fce6d21b063" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_contents" ADD CONSTRAINT "FK_beeaaccdbd4bbb592a399997647" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_modules" ADD CONSTRAINT "FK_81644557c2401f37fe9e884e884" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificate_alerts" ADD CONSTRAINT "FK_3ad21b4c2684df34f2fdcac13bd" FOREIGN KEY ("certificate_id") REFERENCES "certificates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificate_alerts" ADD CONSTRAINT "FK_cb12cf293163d55801adea4341a" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD CONSTRAINT "FK_8d212d8f43d2ca9eee2e1a0bf52" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD CONSTRAINT "FK_3b6a412073ea28153dc20a843b4" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD CONSTRAINT "FK_f0f3773b2ccb7811da9ccd63d94" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_5e8aaadcc029e52efdfeedeabe8" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_b79d0bf01779fdf9cfb6b092af3" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_4e8fb47e48de86534c3bc102d4b" FOREIGN KEY ("learning_path_enrollment_id") REFERENCES "learning_path_enrollments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_0836c1b4896d74697df49b92046" FOREIGN KEY ("learning_path_course_id") REFERENCES "learning_path_courses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_8b995321a1612cd37be062e7ad3" FOREIGN KEY ("reenrollment_of_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_attempts" ADD CONSTRAINT "FK_6863844211f35627a992fe16285" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_attempts" ADD CONSTRAINT "FK_a6580a164dbc7b3232c8a2f063e" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessment_attempts" DROP CONSTRAINT "FK_a6580a164dbc7b3232c8a2f063e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_attempts" DROP CONSTRAINT "FK_6863844211f35627a992fe16285"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "FK_8b995321a1612cd37be062e7ad3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "FK_0836c1b4896d74697df49b92046"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "FK_4e8fb47e48de86534c3bc102d4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "FK_b79d0bf01779fdf9cfb6b092af3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "FK_5e8aaadcc029e52efdfeedeabe8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP CONSTRAINT "FK_f0f3773b2ccb7811da9ccd63d94"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP CONSTRAINT "FK_3b6a412073ea28153dc20a843b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP CONSTRAINT "FK_8d212d8f43d2ca9eee2e1a0bf52"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificate_alerts" DROP CONSTRAINT "FK_cb12cf293163d55801adea4341a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificate_alerts" DROP CONSTRAINT "FK_3ad21b4c2684df34f2fdcac13bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_modules" DROP CONSTRAINT "FK_81644557c2401f37fe9e884e884"`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_contents" DROP CONSTRAINT "FK_beeaaccdbd4bbb592a399997647"`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_progress" DROP CONSTRAINT "FK_f8100e4c38116de5fce6d21b063"`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_progress" DROP CONSTRAINT "FK_0a74a687b5ec47710e798b11294"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_path_courses" DROP CONSTRAINT "FK_d06e966a2d7fb6101d92b4a5f02"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_path_courses" DROP CONSTRAINT "FK_68caef24fcbb3d4aeb46e857653"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_path_enrollments" DROP CONSTRAINT "FK_741a8c589365053ab10c641bd57"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_path_enrollments" DROP CONSTRAINT "FK_7d554a0392122dd3bd19a243ec5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" DROP CONSTRAINT "FK_b1507ca50d9d279f752ceffc1c7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" DROP CONSTRAINT "FK_37fe5168e0e0d65295042d47ea4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" DROP CONSTRAINT "FK_2d83c53c3e553a48dadb9722e38"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP CONSTRAINT "FK_2d76c87300726d247589833f63f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_bce633b738e5ad4e54f90f9a461"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answers" DROP CONSTRAINT "FK_fff29b83c9965e08837b508f0cd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answers" DROP CONSTRAINT "FK_32015c863766540050618a1165c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answer_options" DROP CONSTRAINT "FK_530490f1a5ac047da7a81658a8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answer_options" DROP CONSTRAINT "FK_2f1e58272bc27d0e834faccf388"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_options" DROP CONSTRAINT "FK_f0b7aaabd3f88e700daf0fe681c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6863844211f35627a992fe1628"`,
    );
    await queryRunner.query(`DROP TABLE "assessment_attempts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_enrollments_employee_course_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8b995321a1612cd37be062e7ad"`,
    );
    await queryRunner.query(`DROP TABLE "enrollments"`);
    await queryRunner.query(`DROP TYPE "public"."enrollments_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_certificates_report"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3a9806fe68cab7c101a5c344ae"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f0f3773b2ccb7811da9ccd63d9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0387224f2281652909605da294"`,
    );
    await queryRunner.query(`DROP TABLE "certificates"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_certificate_alerts_employee_status_type"`,
    );
    await queryRunner.query(`DROP TABLE "certificate_alerts"`);
    await queryRunner.query(
      `DROP TYPE "public"."certificate_alerts_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."certificate_alerts_alert_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_86b3589486bac01d2903e22471"`,
    );
    await queryRunner.query(`DROP TABLE "courses"`);
    await queryRunner.query(`DROP TYPE "public"."courses_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_81644557c2401f37fe9e884e88"`,
    );
    await queryRunner.query(`DROP TABLE "course_modules"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_beeaaccdbd4bbb592a39999764"`,
    );
    await queryRunner.query(`DROP TABLE "module_contents"`);
    await queryRunner.query(
      `DROP TYPE "public"."module_contents_content_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_module_progress_enrollment_status"`,
    );
    await queryRunner.query(`DROP TABLE "module_progress"`);
    await queryRunner.query(`DROP TYPE "public"."module_progress_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_68caef24fcbb3d4aeb46e85765"`,
    );
    await queryRunner.query(`DROP TABLE "learning_path_courses"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_72217dff97d718a5494d698f56"`,
    );
    await queryRunner.query(`DROP TABLE "learning_paths"`);
    await queryRunner.query(`DROP TYPE "public"."learning_paths_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_741a8c589365053ab10c641bd5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7d554a0392122dd3bd19a243ec"`,
    );
    await queryRunner.query(`DROP TABLE "learning_path_enrollments"`);
    await queryRunner.query(
      `DROP TYPE "public"."learning_path_enrollments_status_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_employees_area_active"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b1507ca50d9d279f752ceffc1c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_37fe5168e0e0d65295042d47ea"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_56162b5f24af743a154680684f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2d83c53c3e553a48dadb9722e3"`,
    );
    await queryRunner.query(`DROP TABLE "employees"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dc1e008241ee7a27c86ec56bab"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4a6c0938935e2a91dcce8ab71d"`,
    );
    await queryRunner.query(`DROP TABLE "job_levels"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8c2ad80240e18fcac9e7c52631"`,
    );
    await queryRunner.query(`DROP TABLE "areas"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2d76c87300726d247589833f63"`,
    );
    await queryRunner.query(`DROP TABLE "assessments"`);
    await queryRunner.query(`DROP TYPE "public"."assessments_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bce633b738e5ad4e54f90f9a46"`,
    );
    await queryRunner.query(`DROP TABLE "questions"`);
    await queryRunner.query(
      `DROP TYPE "public"."questions_question_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "attempt_answers"`);
    await queryRunner.query(`DROP TABLE "attempt_answer_options"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f0b7aaabd3f88e700daf0fe681"`,
    );
    await queryRunner.query(`DROP TABLE "question_options"`);
  }
}
