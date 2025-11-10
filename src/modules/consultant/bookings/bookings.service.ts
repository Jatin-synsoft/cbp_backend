import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto, UpdateBookingStatusDto } from './dto/update-booking.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Booking } from 'src/database/models/booking.model';
import { BookingStatus } from 'src/common/enums/booking-status.enum';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking)
    private readonly bookingModel: typeof Booking,
  ) { }

  async updateBookingStatus(id: number, dto: UpdateBookingStatusDto) {
    const booking = await this.bookingModel.findByPk(id);
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled booking');
    }

    booking.status = dto.status;
    await booking.save();

    return {
      message: `Booking status updated to '${dto.status}' successfully`,
    };
  }
}
