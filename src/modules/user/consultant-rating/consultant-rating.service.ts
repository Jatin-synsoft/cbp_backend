import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from 'src/common/enums/booking-status.enum';
import { CreateRatingDto } from './dto/create-consultant-rating.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Booking } from 'src/database/models/booking.model';
import { ConsultantRating } from 'src/database/models/consultantRating.model';


@Injectable()
export class ConsultantRatingService {
  constructor(
    @InjectModel(ConsultantRating) private ratingModel: typeof ConsultantRating,
    @InjectModel(Booking) private bookingModel: typeof Booking,
  ) { }

  async createRating(userId: number, dto: CreateRatingDto) {
    const booking = await this.bookingModel.findByPk(dto.bookingId);

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.customerId !== userId) {
      throw new BadRequestException('You cannot rate this booking');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('You can rate only completed bookings');
    }

    const existing = await this.ratingModel.findOne({
      where: { bookingId: dto.bookingId, userId },
    });

    if (existing) {
      throw new BadRequestException('You have already rated this booking');
    }

    const rating = await this.ratingModel.create({ ...dto, userId });

    return {
      message: 'Rating submitted successfully',
      data: rating,
    };
  }


  async getRatingByBookingId(bookingId: number) {
    const rating = await this.ratingModel.findOne({
      where: { bookingId },
      // include: ['consultant', 'customer', 'booking'] 
    });

    if (!rating) {
      return {
        message: 'Rating retrieved successfully',
        data: {},
      };
    }

    return {
      message: 'Rating retrieved successfully',
      data: rating,
    };
  }
}
