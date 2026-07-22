export type DatabaseSslOptions =
  false | { ca: string; rejectUnauthorized: true };

export function resolveDatabaseSsl(
  enabled: boolean,
  certificateAuthority?: string,
): DatabaseSslOptions {
  if (!enabled) return false;
  if (!certificateAuthority?.trim()) {
    throw new Error('DB_SSL_CA is required when DB_SSL is enabled');
  }
  return {
    ca: certificateAuthority.replace(/\\n/g, '\n'),
    rejectUnauthorized: true,
  };
}
