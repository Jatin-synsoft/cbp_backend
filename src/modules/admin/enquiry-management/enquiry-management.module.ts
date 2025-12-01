import { Module } from '@nestjs/common';
import { EnquiryManagementService } from './enquiry-management.service';
import { EnquiryManagementController } from './enquiry-management.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EnquiryManagementController],
  providers: [EnquiryManagementService],
})
export class EnquiryManagementModule { }
