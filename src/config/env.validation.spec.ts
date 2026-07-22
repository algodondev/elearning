import { envValidationSchema } from './env.validation';

const requiredEnvironment = {
  DB_HOST: 'aws-0-us-east-1.pooler.supabase.com',
  DB_PORT: 5432,
  DB_NAME: 'postgres',
  DB_USER: 'postgres.project-ref',
  DB_PASSWORD: 'database-password',
  JWT_SECRET: 'a-production-jwt-secret-with-at-least-32-characters',
};

describe('environment validation', () => {
  it('keeps database TLS disabled by default for local PostgreSQL', () => {
    const { error, value } = envValidationSchema.validate(requiredEnvironment);

    expect(error).toBeUndefined();
    expect(value.DB_SSL).toBe(false);
  });

  it('accepts verified database TLS when a CA certificate is provided', () => {
    const { error, value } = envValidationSchema.validate({
      ...requiredEnvironment,
      DB_SSL: 'true',
      DB_SSL_CA:
        '-----BEGIN CERTIFICATE-----\\ncertificate\\n-----END CERTIFICATE-----',
    });

    expect(error).toBeUndefined();
    expect(value.DB_SSL).toBe(true);
  });

  it('rejects database TLS without a CA certificate', () => {
    const { error } = envValidationSchema.validate({
      ...requiredEnvironment,
      DB_SSL: 'true',
    });

    expect(error?.message).toContain('DB_SSL_CA');
  });
});
