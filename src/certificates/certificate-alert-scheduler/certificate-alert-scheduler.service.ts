import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CertificateAlertsService } from '../certificate-alerts/certificate-alerts.service';

@Injectable()
export class CertificateAlertSchedulerService {
  private activeRun: ReturnType<CertificateAlertsService['run']> | null = null;

  constructor(private readonly alerts: CertificateAlertsService) {}

  @Cron(process.env.ALERT_CRON ?? '0 0 2 * * *', {
    name: 'certificate-expiry-alerts',
    timeZone: 'UTC',
  })
  runDaily() {
    if (this.activeRun) return this.activeRun;
    this.activeRun = this.alerts.run().finally(() => {
      this.activeRun = null;
    });
    return this.activeRun;
  }
}
