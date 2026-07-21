import { Module } from '@nestjs/common';
import { Clock } from './time/clock/clock';

@Module({
  providers: [Clock],
  exports: [Clock],
})
export class CommonModule {}
