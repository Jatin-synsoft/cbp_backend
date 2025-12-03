import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtRolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Consultant Dashboard')
@ApiBearerAuth()
@UseGuards(JwtRolesGuard)
@Roles(2)
@Controller('dashboard/consultant')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('overview')
  getOverview(@GetUser() user: any) {
    return this.dashboardService.getOverview(user.id);
  }

  @Get('today-sessions')
  getTodaySessions(@GetUser() user: any) {
    return this.dashboardService.getTodaySessions(user.id);
  }

  @Get('earnings-summary')
  getEarningsSummary(@GetUser() user: any) {
    return this.dashboardService.getEarningsSummary(user.id);
  }

  @Get('recent-bookings')
  getRecentBookings(@GetUser() user: any) {
    return this.dashboardService.getRecentBookings(user.id);
  }

  @Get('ratings')
  getRatings(@GetUser() user: any) {
    return this.dashboardService.getRatings(user.id);
  }
}
