import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtRolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(JwtRolesGuard)
@Roles(1)
@Controller('dashboard')
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
}
