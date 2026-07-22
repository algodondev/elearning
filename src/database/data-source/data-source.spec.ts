const DATABASE_ENV_KEYS = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'DB_LOGGING',
  'DB_SSL',
  'DB_SSL_CA',
] as const;

const originalValues = Object.fromEntries(
  DATABASE_ENV_KEYS.map((key) => [key, process.env[key]]),
);

function setDatabaseEnvironment(overrides: NodeJS.ProcessEnv = {}): void {
  Object.assign(process.env, {
    DB_HOST: 'database.example.com',
    DB_PORT: '5432',
    DB_NAME: 'postgres',
    DB_USER: 'postgres.project-ref',
    DB_PASSWORD: 'database-password',
    DB_LOGGING: 'false',
    ...overrides,
  });
}

function loadDataSource() {
  let loaded: typeof import('./data-source').default | undefined;
  jest.isolateModules(() => {
    loaded =
      jest.requireActual<typeof import('./data-source')>(
        './data-source',
      ).default;
  });
  return loaded!;
}

describe('TypeORM CLI data source TLS', () => {
  afterEach(() => {
    for (const key of DATABASE_ENV_KEYS) {
      const original = originalValues[key];
      if (original === undefined) delete process.env[key];
      else process.env[key] = original;
    }
    jest.resetModules();
  });

  it('uses an unencrypted local connection when DB_SSL is disabled', () => {
    setDatabaseEnvironment({ DB_SSL: 'false' });

    const dataSource = loadDataSource();

    expect(dataSource.options.ssl).toBe(false);
  });

  it('normalizes an escaped CA certificate and verifies managed PostgreSQL', () => {
    setDatabaseEnvironment({
      DB_SSL: 'true',
      DB_SSL_CA:
        '-----BEGIN CERTIFICATE-----\\ncertificate-body\\n-----END CERTIFICATE-----',
    });

    const dataSource = loadDataSource();

    expect(dataSource.options.ssl).toEqual({
      ca: '-----BEGIN CERTIFICATE-----\ncertificate-body\n-----END CERTIFICATE-----',
      rejectUnauthorized: true,
    });
  });

  it('refuses managed PostgreSQL TLS without a CA certificate', () => {
    setDatabaseEnvironment({ DB_SSL: 'true' });
    delete process.env.DB_SSL_CA;

    expect(() => loadDataSource()).toThrow(
      'DB_SSL_CA is required when DB_SSL is enabled',
    );
  });
});
