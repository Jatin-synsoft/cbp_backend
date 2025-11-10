import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtRolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { GetAvailabilityDto, ScheduleDto } from './dto/schedule.dto';
import { ScheduleService } from './schedule.service';

@ApiTags('Consultant schedule management')
@ApiBearerAuth()
@UseGuards(JwtRolesGuard)
@Roles(2)
@Controller('consultant/schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) { }

  @Post('')
  @ApiOperation({ summary: 'create consultant schedule' })
  async createConsultantSchedule(@Body() dto: ScheduleDto, @GetUser() user: any) {
    return this.scheduleService.createSchedule(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update consultant schedule' })
  async updateConsultantSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ScheduleDto,
    @GetUser() user: any,
  ) {
    return this.scheduleService.updateSchedule(id, dto, user.id);
  }

  @Get(':id/availability')
  @Public()
  @ApiOperation({ summary: 'Get consultant availability' })
  async getConsultantAvailability(@Param('id', ParseIntPipe) id: number, @Query() query: GetAvailabilityDto,) {
    return this.scheduleService.getConsultantAvailability(id, query);
  }

  @Get("my-schedule")
  @ApiOperation({ summary: "Get provider schedules" })
  @ApiResponse({ status: 200, description: "Return provider schedules." })
  @ApiResponse({ status: 404, description: "Provider not found." })
  async consultantScheduleList(@GetUser() user: any) {
    return this.scheduleService.getSchedules(user.id);
  }
}
