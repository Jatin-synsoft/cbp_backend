import { Module } from '@nestjs/common';
import { ConsultantRatingModule } from './consultant-rating/consultant-rating.module';

@Module({
  imports: [ConsultantRatingModule]
})
export class UserModule {}
