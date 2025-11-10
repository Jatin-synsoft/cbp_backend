import { Module } from '@nestjs/common';
import { ScheduleModule } from './schedule/schedule.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
    imports: [ScheduleModule, BookingsModule],
    controllers: [],
    providers: [],

})
export class ConsultantModule { }
