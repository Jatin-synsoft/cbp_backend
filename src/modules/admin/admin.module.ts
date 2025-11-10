import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
    imports: [UsersModule, DashboardModule],
    controllers: [],
    providers: [],

})
export class AdminModule { }
