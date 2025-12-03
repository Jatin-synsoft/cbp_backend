import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtRolesGuard } from 'src/common/Guards/roles.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';


@ApiTags('User Dashboard')
@ApiBearerAuth()
@UseGuards(JwtRolesGuard)
@Roles(3)
@Controller('dashboard/user')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  // 1. User Overview
  @Get('overview')
  getOverview(@GetUser() user: any) {
    return this.dashboardService.getUserOverview(user.id);
  }


  @Get('sessions-summary')
  async sessionsSummary(@GetUser() user: any) {
    const userId = user.id; // JWT auth should set req.user
    return this.dashboardService.getSessionsSummary(userId);
  }

  // -------------------------------
  // 2. Bookings List API
  // GET /dashboard/user/bookings
  // -------------------------------
  @Get('bookings')
  async bookingsList(@GetUser() user: any) {
    const userId = user.id;
    return this.dashboardService.getBookingsList(userId);
  }
}
