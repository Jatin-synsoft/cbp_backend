import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Booking } from 'src/database/models/booking.model';
import { BookingTransaction } from 'src/database/models/bookingTransaction.model';
import { User } from 'src/database/models/user.model';
import { ConsultantPayout } from 'src/database/models/consultantPayout.model';

import { BookingStatus } from 'src/common/enums/booking-status.enum';
import { BookingTransactionStatus } from 'src/common/enums/booking-status.enum';
import { Op } from 'sequelize';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Booking) private readonly bookingModel: typeof Booking,
    @InjectModel(BookingTransaction) private readonly transactionModel: typeof BookingTransaction,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(ConsultantPayout) private readonly payoutModel: typeof ConsultantPayout,
  ) { }

  // ---------------------------------------------
  // 1. User Overview
  // ---------------------------------------------
  async getUserOverview(userId: number) {
    try {
      const totalBookings = await this.bookingModel.count({
        where: { customerId: userId },
      });

      const upcomingBookings = await this.bookingModel.count({
        where: {
          customerId: userId,
          status: BookingStatus.CONFIRMED,
          bookingDate: { $gte: new Date() },
        },
      });

      const cancelledBookings = await this.bookingModel.count({
        where: {
          customerId: userId,
          status: BookingStatus.CANCELLED,
        },
      });

      const transactions = await this.transactionModel.findAll({
        where: { status: BookingTransactionStatus.PAYMENT_SUCCESS },
        include: [{
          model: this.bookingModel,
          where: { customerId: userId }
        }],
        attributes: ['amount']
      });

      const totalSpent = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);


      return {
        statusCode: 200,
        message: 'User overview fetched successfully',
        data: {
          totalBookings,
          upcomingBookings,
          cancelledBookings,
          totalSpent: totalSpent || 0,
        },
      };
    } catch (err) {
      console.error(err);
      throw new BadRequestException('Failed to fetch user overview');
    }
  }


  async getSessionsSummary(userId: number) {
    try {
      const bookings = await this.bookingModel.findAll({
        where: { customerId: userId },
        attributes: ['status']
      });

      const total = bookings.length;
      const success = bookings.filter(b => b.status === BookingStatus.COMPLETED).length;
      const pending = bookings.filter(b => b.status === BookingStatus.PENDING).length;

      return {
        statusCode: 200,
        message: 'Sessions summary fetched successfully',
        data: { total, success, pending },
      };
    } catch (err) {
      console.error(err);
      throw new BadRequestException('Failed to fetch sessions summary');
    }
  }

  // -------------------------------
  // 2. Upcoming & Previous Bookings
  // -------------------------------
  async getBookingsList(userId: number) {

    const today = new Date();

    // Upcoming Bookings (next 3)
    const upcoming = await this.bookingModel.findAll({
      where: {
        customerId: userId,
        bookingDate: { [Op.gte]: today },
      },
      include: [
        { model: this.userModel, as: 'consultant', attributes: ['id', 'fullName'] },
      ],
      order: [['bookingDate', 'ASC'], ['startTime', 'ASC']],
      limit: 3,
    });

    // Previous Bookings (last 3)
    const previous = await this.bookingModel.findAll({
      where: {
        customerId: userId,
        bookingDate: { [Op.lt]: today },
      },
      include: [
        { model: this.userModel, as: 'consultant', attributes: ['id', 'fullName'] },
      ],
      order: [['bookingDate', 'DESC'], ['startTime', 'DESC']],
      limit: 3,
    });

    return {
      statusCode: 200,
      message: 'Bookings fetched successfully',
      data: { upcoming, previous },
    };

  }

}
