import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { DatabaseModule } from 'src/database/database.module';
import { RruleService } from 'src/services/rrule.service';


@Module({
  imports: [DatabaseModule],
  controllers: [ScheduleController],
  providers: [ScheduleService, RruleService],
})
export class ScheduleModule { }
