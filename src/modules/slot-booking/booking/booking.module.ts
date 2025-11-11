import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { RruleService } from 'src/services/rrule.service';
import { DatabaseModule } from 'src/database/database.module';
import { MailService } from 'src/modules/mail/mail-sendgrid.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BookingController],
  providers: [BookingService, RruleService, MailService],
})
export class BookingModule { }
