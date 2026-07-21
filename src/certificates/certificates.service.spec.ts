import { CertificatesService } from './certificates.service';

type CertificateApi = {
  getStatus: (expiresAt: Date, asOf: Date) => string;
};

describe('CertificatesService time classification', () => {
  const service = new CertificatesService() as unknown as CertificateApi;
  const asOf = new Date('2026-07-20T00:00:00.000Z');

  it.each([
    ['2026-08-20T00:00:00.000Z', 'VALID'],
    ['2026-08-19T00:00:00.000Z', 'EXPIRING_SOON'],
    ['2026-07-21T00:00:00.000Z', 'EXPIRING_SOON'],
    ['2026-07-20T00:00:00.000Z', 'EXPIRED'],
    ['2026-07-19T23:59:59.999Z', 'EXPIRED'],
  ])('classifies %s as %s', (expiresAt, expected) => {
    expect(service.getStatus(new Date(expiresAt), asOf)).toBe(expected);
  });
});
