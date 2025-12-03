import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtRolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(JwtRolesGuard)
@Roles(1)
@Controller('dashboard/admin')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('user-counts')
  @ApiOperation({ summary: 'Get user counts (total, consultants, end-users)' })
  getUserCounts() {
    return this.dashboardService.getUserCounts();
  }

  @Get('recent-users')
  @ApiOperation({ summary: 'Get last 20 registered users' })
  getRecentUsers() {
    return this.dashboardService.getLastUsers();
  }

  @Get('overview')
  @ApiOperation({ summary: 'Admin Overview stats' })
  async overview() {
    return this.dashboardService.getOverview();
  }

  @Get('recent-bookings')
  @ApiOperation({ summary: 'Recent bookings list for admin' })
  async recentBookings() {
    return this.dashboardService.getRecentBookings();
  }

  @Get('recent-users')
  @ApiOperation({ summary: 'Recent 5 registered users' })
  async recentUsers() {
    return this.dashboardService.getRecentUsers();
  }

  @Get('earnings-summary')
  @ApiOperation({ summary: 'Platform earnings summary (weekly/monthly)' })
  async earningsSummary() {
    return this.dashboardService.getEarningsSummary();
  }

  @Get('top-consultants')
  @ApiOperation({ summary: 'Top consultants by revenue' })
  async topConsultants() {
    return this.dashboardService.getTopConsultants();
  }
}
