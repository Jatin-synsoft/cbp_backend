import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, BadRequestException, Query } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingResponseDto, CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtRolesGuard } from 'src/common/Guards/roles.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { PaginationDto } from './dto/pagination.dto';

@ApiTags("Bookings")
@ApiBearerAuth()
@UseGuards(JwtRolesGuard)
@Roles(3)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) { }

  @Post('create')
  @ApiOperation({ summary: "Create a new booking" })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  async create(@GetUser() user: any, @Body() bookingDto: CreateBookingDto): Promise<BookingResponseDto> {

    const result: any = await this.bookingService.createBooking(bookingDto, user.id);

    if (!result.isValid) {
      throw new BadRequestException(`Booking not available on ${result.conflicts.join(", ")}`,);
    }

    return result;
  }


  @Get('bookings')
  @Roles(3, 2)
  @ApiOperation({ summary: 'Get all bookings for user or consultant' })
  async getBookings(@Query() query: PaginationDto, @GetUser() user: any) {
    return this.bookingService.findAllBookings(user, query);
  }

}
