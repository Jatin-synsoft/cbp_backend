import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { RruleService } from 'src/services/rrule.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BookingController],
  providers: [BookingService,RruleService,],
})
export class BookingModule {}
