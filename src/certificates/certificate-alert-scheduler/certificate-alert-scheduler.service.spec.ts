import { CertificateAlertSchedulerService } from './certificate-alert-scheduler.service';

describe('CertificateAlertSchedulerService', () => {
  it('delegates scheduled work to the shared alert service', async () => {
    const alerts = {
      run: jest.fn().mockResolvedValue({ processed: 2, created: 2 }),
    };
    const service = new CertificateAlertSchedulerService(alerts as never);

    await expect(service.runDaily()).resolves.toEqual({
      processed: 2,
      created: 2,
    });
    expect(alerts.run).toHaveBeenCalledTimes(1);
  });

  it('coalesces overlapping executions and permits a later run', async () => {
    let resolveRun: (value: { processed: number; created: number }) => void;
    const pending = new Promise<{ processed: number; created: number }>(
      (resolve) => {
        resolveRun = resolve;
      },
    );
    const alerts = { run: jest.fn().mockReturnValueOnce(pending) };
    const service = new CertificateAlertSchedulerService(alerts as never);

    const first = service.runDaily();
    const overlapping = service.runDaily();
    expect(alerts.run).toHaveBeenCalledTimes(1);
    resolveRun!({ processed: 1, created: 1 });
    await expect(Promise.all([first, overlapping])).resolves.toEqual([
      { processed: 1, created: 1 },
      { processed: 1, created: 1 },
    ]);

    alerts.run.mockResolvedValueOnce({ processed: 0, created: 0 });
    await service.runDaily();
    expect(alerts.run).toHaveBeenCalledTimes(2);
  });
});
