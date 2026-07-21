import { Module } from '@nestjs/common';
import { CertificatesController } from './certificates.controller';
import { CertificateAlertSchedulerService } from './certificate-alert-scheduler/certificate-alert-scheduler.service';
import { CertificateAlertsService } from './certificate-alerts/certificate-alerts.service';
import { CertificateAlertsController } from './certificate-alerts/certificate-alerts.controller';
import { CertificatesService } from './certificates.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificateEntity } from './entities/certificate.entity/certificate.entity';
import { CertificateAlertEntity } from './entities/certificate-alert.entity/certificate-alert.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([CertificateEntity, CertificateAlertEntity]),
  ],
  controllers: [CertificatesController, CertificateAlertsController],
  providers: [
    CertificatesService,
    CertificateAlertsService,
    CertificateAlertSchedulerService,
  ],
  exports: [CertificatesService, CertificateAlertsService, TypeOrmModule],
})
export class CertificatesModule {}
