import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Booking } from 'src/database/models/booking.model';
import { BookingTransaction } from 'src/database/models/bookingTransaction.model';
import { User } from 'src/database/models/user.model';
import { ConsultantPayout } from 'src/database/models/consultantPayout.model';

import { BookingStatus } from 'src/common/enums/booking-status.enum';
import { BookingTransactionStatus } from 'src/common/enums/booking-status.enum';
import { Op, Sequelize } from 'sequelize';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Booking) private readonly bookingModel: typeof Booking,
    @InjectModel(BookingTransaction) private readonly transactionModel: typeof BookingTransaction,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(ConsultantPayout) private readonly payoutModel: typeof ConsultantPayout,
  ) { }


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


  // async getSessionsSummary(userId: number) {
  //   const bookings = await this.bookingModel.findAll({
  //     where: { customerId: userId },
  //     attributes: ['status']
  //   });

  //   const total = bookings.length;
  //   const success = bookings.filter(b => b.status === BookingStatus.COMPLETED).length;
  //   const pending = bookings.filter(b => b.status === BookingStatus.PENDING || b.status === BookingStatus.CONFIRMED).length;

  //   return {
  //     statusCode: 200,
  //     message: 'Sessions summary fetched successfully',
  //     data: { total, success, pending },
  //   };

  // }


  async getSessionsSummary(userId: number) {
    const result = await this.bookingModel.findOne({
      where: { customerId: userId },
      attributes: [
        [
          Sequelize.fn(
            'COALESCE',
            Sequelize.fn('COUNT', Sequelize.col('id')),
            0
          ),
          'total',
        ],

        [
          Sequelize.fn(
            'COALESCE',
            Sequelize.literal(
              `SUM(CASE WHEN status = '${BookingStatus.COMPLETED}' THEN 1 ELSE 0 END)`
            ),
            0
          ),
          'completed',
        ],

        [
          Sequelize.fn(
            'COALESCE',
            Sequelize.literal(
              `SUM(CASE WHEN status = '${BookingStatus.CONFIRMED}' THEN 1 ELSE 0 END)`
            ),
            0
          ),
          'confirmed',
        ],
      ],
      raw: true,
    });

    return {
      statusCode: 200,
      message: 'Sessions summary fetched successfully',
      data: result,
    };
  }



  async getBookingsList(userId: number) {

    const upcoming = await this.bookingModel.findAll({
      where: {
        customerId: userId,
        status: { [Op.in]: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      },
      include: [
        { model: this.userModel, as: 'consultant', attributes: ['id', 'fullName'] },
      ],
      order: [['scheduleDate', 'ASC'], ['startTime', 'ASC']],
      limit: 3,
    });

    return {
      statusCode: 200,
      message: 'Bookings fetched successfully',
      data: { upcoming }
    };

  }

}
