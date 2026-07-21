import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type Auth = 'admin' | 'learner' | 'none';

interface CollectionItem {
  name: string;
  request: Record<string, unknown>;
  event?: Array<Record<string, unknown>>;
}

const jsonHeader = [{ key: 'Content-Type', value: 'application/json' }];

function testLines(status: number, ...extra: string[]): string[] {
  return [
    `pm.test('status is ${status}', () => pm.response.to.have.status(${status}));`,
    ...extra,
  ];
}

function requestItem(
  name: string,
  method: HttpMethod,
  path: string,
  options: {
    auth?: Auth;
    body?: Record<string, unknown>;
    tests?: string[];
  } = {},
): CollectionItem {
  const auth = options.auth ?? 'admin';
  const headers = [...jsonHeader];
  if (auth !== 'none') {
    headers.push({
      key: 'Authorization',
      value: `Bearer {{${auth}Token}}`,
    });
  }
  return {
    name,
    request: {
      method,
      header: headers,
      url: `{{baseUrl}}${path}`,
      ...(options.body
        ? {
            body: {
              mode: 'raw',
              raw: JSON.stringify(options.body, null, 2),
              options: { raw: { language: 'json' } },
            },
          }
        : {}),
    },
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: options.tests ?? testLines(200),
        },
      },
    ],
  };
}

const collection = {
  info: {
    _postman_id: '4ab8b4dc-5ce7-4e4f-b405-d8201878ad68',
    name: 'Corporate E-Learning API - Acceptance',
    description:
      'Executable rubric flow. Run `npm run seed` first, start the API, then execute `npm run postman:test`. Development credentials are intentionally local-only.',
    schema:
      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  event: [
    {
      listen: 'prerequest',
      script: {
        type: 'text/javascript',
        exec: [
          "if (!pm.collectionVariables.get('runId')) { pm.collectionVariables.set('runId', Date.now().toString()); }",
        ],
      },
    },
  ],
  variable: [
    { key: 'runId', value: '' },
    { key: 'areaId', value: '' },
    { key: 'jobLevelId', value: '' },
    { key: 'employeeId', value: '' },
    { key: 'courseId', value: '' },
    { key: 'moduleId', value: '' },
    { key: 'assessmentId', value: '' },
    { key: 'questionId', value: '' },
    { key: 'correctOptionId', value: '' },
    { key: 'pathId', value: '' },
    { key: 'pathAssignmentId', value: '' },
    { key: 'enrollmentId', value: '' },
    { key: 'certificateId', value: '' },
    { key: 'secondEnrollmentId', value: '' },
  ],
  item: [
    {
      name: '00 Health and login',
      item: [
        requestItem('Database readiness', 'GET', '/health', {
          auth: 'none',
          tests: testLines(
            200,
            "pm.test('database is up', () => pm.expect(pm.response.json().database).to.eql('up'));",
          ),
        }),
        requestItem('Admin login', 'POST', '/auth/login', {
          auth: 'none',
          body: {
            email: 'admin@elearning.local',
            password: 'DevOnly123!',
          },
          tests: testLines(
            201,
            "const json = pm.response.json(); pm.environment.set('adminToken', json.accessToken);",
            "pm.test('admin role', () => pm.expect(json.user.role).to.eql('ADMIN'));",
          ),
        }),
      ],
    },
    {
      name: '01 Organization and employee setup',
      item: [
        requestItem('Create area', 'POST', '/areas', {
          body: {
            name: 'Postman Area {{runId}}',
            description: 'Acceptance run',
          },
          tests: testLines(
            201,
            "pm.collectionVariables.set('areaId', pm.response.json().id);",
          ),
        }),
        requestItem('Create job level', 'POST', '/job-levels', {
          body: {
            name: 'Postman Level {{runId}}',
            rankOrder: 1000000000,
            description: 'Acceptance run',
          },
          tests: testLines(
            201,
            "pm.collectionVariables.set('jobLevelId', pm.response.json().id);",
          ),
        }),
        requestItem('Create employee and account', 'POST', '/employees', {
          body: {
            email: 'postman.{{runId}}@example.com',
            password: 'PostmanPass123!',
            employeeCode: 'PM-{{runId}}',
            firstName: 'Postman',
            lastName: 'Learner',
            areaId: '{{areaId}}',
            jobLevelId: '{{jobLevelId}}',
            hireDate: '2026-01-15',
          },
          tests: testLines(
            201,
            "const json = pm.response.json(); pm.collectionVariables.set('employeeId', json.id);",
            "pm.test('password hash is hidden', () => pm.expect(JSON.stringify(json)).not.to.include('passwordHash'));",
          ),
        }),
        requestItem('Learner login', 'POST', '/auth/login', {
          auth: 'none',
          body: {
            email: 'postman.{{runId}}@example.com',
            password: 'PostmanPass123!',
          },
          tests: testLines(
            201,
            "const json = pm.response.json(); pm.environment.set('learnerToken', json.accessToken);",
            "pm.test('employee claim', () => pm.expect(json.user.employeeId).to.eql(pm.collectionVariables.get('employeeId')));",
          ),
        }),
      ],
    },
    {
      name: '02 Course and assessment authoring',
      item: [
        requestItem('Create mandatory course', 'POST', '/courses', {
          body: {
            code: 'PM-{{runId}}',
            title: 'Postman API Course {{runId}}',
            description: 'Generated acceptance course',
            estimatedDurationMinutes: 30,
            isMandatory: true,
            certificateValidityDays: 1,
          },
          tests: testLines(
            201,
            "pm.collectionVariables.set('courseId', pm.response.json().id);",
          ),
        }),
        requestItem(
          'Add required module',
          'POST',
          '/courses/{{courseId}}/modules',
          {
            body: {
              title: 'Required module',
              description: 'Must be completed',
              sequenceNumber: 1,
              estimatedDurationMinutes: 30,
              isRequired: true,
            },
            tests: testLines(
              201,
              "pm.collectionVariables.set('moduleId', pm.response.json().id);",
            ),
          },
        ),
        requestItem(
          'Add text content',
          'POST',
          '/modules/{{moduleId}}/contents',
          {
            body: {
              title: 'Reading',
              contentType: 'TEXT',
              body: 'Complete this material before the assessment.',
              sequenceNumber: 1,
            },
            tests: testLines(201),
          },
        ),
        requestItem(
          'Create assessment',
          'POST',
          '/courses/{{courseId}}/assessments',
          {
            body: { title: 'Final assessment', passingScore: 70 },
            tests: testLines(
              201,
              "pm.collectionVariables.set('assessmentId', pm.response.json().id);",
            ),
          },
        ),
        requestItem(
          'Create question',
          'POST',
          '/assessments/{{assessmentId}}/questions',
          {
            body: {
              prompt: 'Which method retrieves a resource?',
              questionType: 'SINGLE_CHOICE',
              points: 10,
              sequenceNumber: 1,
              options: [
                { optionText: 'GET', isCorrect: true, sequenceNumber: 1 },
                { optionText: 'DELETE', isCorrect: false, sequenceNumber: 2 },
              ],
            },
            tests: testLines(
              201,
              "const json = pm.response.json(); pm.collectionVariables.set('questionId', json.id); pm.collectionVariables.set('correctOptionId', json.options.find(option => option.isCorrect).id);",
            ),
          },
        ),
        requestItem(
          'Publish assessment',
          'POST',
          '/assessments/{{assessmentId}}/publish',
          {
            tests: testLines(201),
          },
        ),
        requestItem('Publish course', 'POST', '/courses/{{courseId}}/publish', {
          tests: testLines(201),
        }),
      ],
    },
    {
      name: '03 Learning-path sequential unlock',
      item: [
        requestItem('Create learning path', 'POST', '/learning-paths', {
          body: {
            name: 'Postman Path {{runId}}',
            description: 'Sequential acceptance path',
          },
          tests: testLines(
            201,
            "pm.collectionVariables.set('pathId', pm.response.json().id);",
          ),
        }),
        requestItem(
          'Add authored course first',
          'POST',
          '/learning-paths/{{pathId}}/courses',
          {
            body: { courseId: '{{courseId}}', sequenceNumber: 1 },
            tests: testLines(201),
          },
        ),
        requestItem(
          'Add seeded course second',
          'POST',
          '/learning-paths/{{pathId}}/courses',
          {
            body: { courseId: '{{seedCourseId}}', sequenceNumber: 2 },
            tests: testLines(201),
          },
        ),
        requestItem(
          'Publish path',
          'POST',
          '/learning-paths/{{pathId}}/publish',
          {
            tests: testLines(201),
          },
        ),
        requestItem('Assign employee', 'POST', '/learning-path-enrollments', {
          body: { learningPathId: '{{pathId}}', employeeId: '{{employeeId}}' },
          tests: testLines(
            201,
            "pm.collectionVariables.set('pathAssignmentId', pm.response.json().id);",
          ),
        }),
        requestItem(
          'Blocked second course',
          'POST',
          '/learning-path-enrollments/{{pathAssignmentId}}/courses/{{seedCourseId}}/enroll',
          {
            tests: testLines(
              409,
              "pm.test('prerequisite error', () => pm.expect(pm.response.json().code).to.eql('LEARNING_PATH_PREREQUISITE_NOT_PASSED'));",
            ),
          },
        ),
        requestItem(
          'Enroll unlocked first course',
          'POST',
          '/learning-path-enrollments/{{pathAssignmentId}}/courses/{{courseId}}/enroll',
          {
            tests: testLines(
              201,
              "pm.collectionVariables.set('enrollmentId', pm.response.json().id);",
            ),
          },
        ),
      ],
    },
    {
      name: '04 Happy flow: progress, pass, certificate',
      item: [
        requestItem(
          'Attempt blocked before module completion',
          'POST',
          '/enrollments/{{enrollmentId}}/assessment-attempts',
          {
            auth: 'learner',
            body: {
              answers: [
                {
                  questionId: '{{questionId}}',
                  selectedOptionIds: ['{{correctOptionId}}'],
                },
              ],
            },
            tests: testLines(
              409,
              "pm.test('module error', () => pm.expect(pm.response.json().code).to.eql('MODULES_INCOMPLETE'));",
            ),
          },
        ),
        requestItem(
          'Complete required module',
          'POST',
          '/enrollments/{{enrollmentId}}/modules/{{moduleId}}/complete',
          {
            auth: 'learner',
            tests: testLines(
              201,
              "pm.test('assessment ready', () => pm.expect(pm.response.json().status).to.eql('READY_FOR_ASSESSMENT'));",
            ),
          },
        ),
        requestItem(
          'Get redacted assessment',
          'GET',
          '/enrollments/{{enrollmentId}}/assessment',
          {
            auth: 'learner',
            tests: testLines(
              200,
              "pm.test('answer key absent', () => pm.expect(JSON.stringify(pm.response.json())).not.to.include('isCorrect'));",
            ),
          },
        ),
        requestItem(
          'Submit passing attempt',
          'POST',
          '/enrollments/{{enrollmentId}}/assessment-attempts',
          {
            auth: 'learner',
            body: {
              answers: [
                {
                  questionId: '{{questionId}}',
                  selectedOptionIds: ['{{correctOptionId}}'],
                },
              ],
            },
            tests: testLines(
              201,
              "const json = pm.response.json(); pm.collectionVariables.set('certificateId', json.certificate.id);",
              "pm.test('passed with certificate', () => { pm.expect(json.passed).to.eql(true); pm.expect(json.enrollmentStatus).to.eql('PASSED'); });",
            ),
          },
        ),
        requestItem(
          'Read own certificate',
          'GET',
          '/certificates/{{certificateId}}',
          {
            auth: 'learner',
            tests: testLines(
              200,
              "pm.test('certificate is currently valid', () => pm.expect(pm.response.json().status).to.be.oneOf(['VALID', 'EXPIRING_SOON']));",
            ),
          },
        ),
        requestItem(
          'Enroll now-unlocked second course',
          'POST',
          '/learning-path-enrollments/{{pathAssignmentId}}/courses/{{seedCourseId}}/enroll',
          {
            tests: testLines(
              201,
              "pm.collectionVariables.set('secondEnrollmentId', pm.response.json().id);",
            ),
          },
        ),
      ],
    },
    {
      name: '05 Three failures and re-enrollment',
      item: [
        requestItem(
          'Complete seeded module',
          'POST',
          '/enrollments/{{secondEnrollmentId}}/modules/{{seedModuleId}}/complete',
          { auth: 'learner', tests: testLines(201) },
        ),
        ...[1, 2, 3].map((attemptNumber) =>
          requestItem(
            `Failed attempt ${attemptNumber}`,
            'POST',
            '/enrollments/{{secondEnrollmentId}}/assessment-attempts',
            {
              auth: 'learner',
              body: {
                answers: [
                  {
                    questionId: '{{seedQuestionId}}',
                    selectedOptionIds: ['{{seedWrongOptionId}}'],
                  },
                ],
              },
              tests: testLines(
                201,
                `pm.test('attempt number ${attemptNumber}', () => pm.expect(pm.response.json().attemptNumber).to.eql(${attemptNumber}));`,
              ),
            },
          ),
        ),
        requestItem(
          'Fourth attempt rejected',
          'POST',
          '/enrollments/{{secondEnrollmentId}}/assessment-attempts',
          {
            auth: 'learner',
            body: {
              answers: [
                {
                  questionId: '{{seedQuestionId}}',
                  selectedOptionIds: ['{{seedWrongOptionId}}'],
                },
              ],
            },
            tests: testLines(
              409,
              "pm.test('attempts exhausted', () => pm.expect(pm.response.json().code).to.eql('ASSESSMENT_ATTEMPTS_EXHAUSTED'));",
            ),
          },
        ),
        requestItem(
          'Create fresh re-enrollment',
          'POST',
          '/enrollments/{{secondEnrollmentId}}/re-enroll',
          {
            tests: testLines(
              201,
              "pm.test('fresh progress', () => { const json = pm.response.json(); pm.expect(json.status).to.eql('ENROLLED'); pm.expect(json.moduleProgress[0].status).to.eql('PENDING'); });",
            ),
          },
        ),
      ],
    },
    {
      name: '06 Alerts and compliance report',
      item: [
        requestItem(
          'Run certificate alerts',
          'POST',
          '/certificate-alerts/run',
          {
            tests: testLines(201),
          },
        ),
        requestItem(
          'List employee alerts',
          'GET',
          '/certificate-alerts?employeeId={{employeeId}}',
          {
            tests: testLines(
              200,
              "pm.test('expiring alert exists', () => pm.expect(pm.response.json().data.some(alert => alert.alertType === 'EXPIRING_30_DAYS')).to.eql(true));",
            ),
          },
        ),
        requestItem(
          'Mandatory compliance report',
          'GET',
          '/reports/compliance/by-area?courseId={{courseId}}',
          {
            tests: testLines(
              200,
              "pm.test('counts reconcile', () => pm.response.json().data.forEach(row => pm.expect(row.validCertificateEmployees + row.expiredOnlyEmployees + row.neverCertifiedEmployees).to.eql(row.applicableActiveEmployees)));",
            ),
          },
        ),
      ],
    },
    {
      name: '07 RBAC and validation negatives',
      item: [
        requestItem('Employee cannot create area', 'POST', '/areas', {
          auth: 'learner',
          body: { name: 'Forbidden area {{runId}}' },
          tests: testLines(403),
        }),
        requestItem('Unknown property is rejected', 'POST', '/courses', {
          body: {
            code: 'INVALID-{{runId}}',
            title: 'Invalid request',
            description: 'Contains an unknown property',
            estimatedDurationMinutes: 1,
            isMandatory: false,
            certificateValidityDays: 1,
            injectedRole: 'ADMIN',
          },
          tests: testLines(
            400,
            "pm.test('validation envelope', () => pm.expect(pm.response.json().code).to.eql('VALIDATION_FAILED'));",
          ),
        }),
      ],
    },
  ],
};

async function generate(): Promise<void> {
  const directory = resolve(process.cwd(), 'postman');
  const output = resolve(
    directory,
    'corporate-elearning.postman_collection.json',
  );
  await mkdir(directory, { recursive: true });
  await writeFile(output, `${JSON.stringify(collection, null, 2)}\n`, 'utf8');
  process.stdout.write(`Generated ${output}\n`);
}

void generate();
