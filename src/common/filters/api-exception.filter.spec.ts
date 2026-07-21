import { ArgumentsHost } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { ApiExceptionFilter } from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  it('maps database constraint violations without leaking SQL details', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status, json }),
        getRequest: () => ({
          originalUrl: '/api/v1/areas',
          requestId: 'db-test',
          header: () => undefined,
        }),
      }),
    } as unknown as ArgumentsHost;
    const error = new QueryFailedError(
      'INSERT INTO areas ...',
      [],
      Object.assign(new Error('duplicate key value reveals private SQL'), {
        code: '23505',
      }),
    );

    new ApiExceptionFilter().catch(error, host);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        message: 'A record with the same unique value already exists.',
        requestId: 'db-test',
      }),
    );
    expect(JSON.stringify(json.mock.calls)).not.toContain('private SQL');
  });
});
