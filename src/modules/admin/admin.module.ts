import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EnquiryManagementModule } from './enquiry-management/enquiry-management.module';

@Module({
    imports: [UsersModule, DashboardModule, EnquiryManagementModule],
    controllers: [],
    providers: [],

})
export class AdminModule { }
