import { Controller, Patch, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { UpdateBookingStatusDto } from './dto/update-booking.dto';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtRolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Consultant Bookings Management')
@ApiBearerAuth()
@UseGuards(JwtRolesGuard)
@Roles(2)
@Controller('consultant/booking')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  @Patch(':id')
  @ApiOperation({ summary: 'Consultant updates booking status or meeting link' })
  async updateBookingStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateBookingStatus(id, dto);
  }

}
