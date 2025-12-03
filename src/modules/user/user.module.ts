import { Module } from '@nestjs/common';
import { ConsultantRatingModule } from './consultant-rating/consultant-rating.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [ConsultantRatingModule, DashboardModule]
})
export class UserModule {}
