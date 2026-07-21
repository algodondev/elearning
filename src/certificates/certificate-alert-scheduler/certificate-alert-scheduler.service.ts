import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CertificateAlertsService } from '../certificate-alerts/certificate-alerts.service';

@Injectable()
export class CertificateAlertSchedulerService {
  constructor(private readonly alerts: CertificateAlertsService) {}

  @Cron(process.env.ALERT_CRON ?? '0 0 2 * * *', {
    name: 'certificate-expiry-alerts',
    timeZone: 'UTC',
  })
  runDaily() {
    return this.alerts.run();
  }
}
