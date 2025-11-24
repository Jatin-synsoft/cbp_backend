import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { DatabaseModule } from 'src/database/database.module';
import { MailService } from 'src/modules/mail/mail-sendgrid.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BookingsController],
  providers: [BookingsService, MailService],
})
export class BookingsModule { }
