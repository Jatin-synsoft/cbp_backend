import { Module } from '@nestjs/common';
import { ScheduleModule } from './schedule/schedule.module';
import { BookingsModule } from './bookings/bookings.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
    imports: [ScheduleModule, BookingsModule, DashboardModule],
    controllers: [],
    providers: [],

})
export class ConsultantModule { }
