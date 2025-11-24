import { Module } from '@nestjs/common';
import { ConsultantRatingService } from './consultant-rating.service';
import { ConsultantRatingController } from './consultant-rating.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ConsultantRatingController],
  providers: [ConsultantRatingService],
})
export class ConsultantRatingModule { }
