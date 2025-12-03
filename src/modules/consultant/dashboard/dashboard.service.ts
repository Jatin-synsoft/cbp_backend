import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Booking } from 'src/database/models/booking.model';
import { BookingTransaction } from 'src/database/models/bookingTransaction.model';
import { ConsultantPayout } from 'src/database/models/consultantPayout.model';
import { ConsultantRating } from 'src/database/models/consultantRating.model';
import { Op, fn, col } from 'sequelize';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Booking) private readonly bookingModel: typeof Booking,
    @InjectModel(BookingTransaction) private readonly transactionModel: typeof BookingTransaction,
    @InjectModel(ConsultantPayout) private readonly payoutModel: typeof ConsultantPayout,
    @InjectModel(ConsultantRating) private readonly ratingModel: typeof ConsultantRating,
  ) { }

  // 1️⃣ Consultant Overview
  async getOverview(consultantId: number) {
    try {
      const totalSessions = await this.bookingModel.count({ where: { consultantId } });
      const completedSessions = await this.bookingModel.count({
        where: { consultantId, status: 'COMPLETED' },
      });
      const pendingSessions = await this.bookingModel.count({
        where: { consultantId, status: 'PENDING' },
      });

      return {
        statusCode: 200,
        message: 'Consultant overview fetched successfully',
        data: { totalSessions, completedSessions, pendingSessions },
      };
    } catch (err) {
      console.error(err);
      throw new BadRequestException('Failed to fetch overview');
    }
  }

  // 2️⃣ Today's Sessions
  async getTodaySessions(consultantId: number) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const sessions = await this.bookingModel.findAll({
        where: { consultantId, bookingDate: today },
        include: [{ association: 'customer', attributes: ['id', 'fullName', 'email'] }],
        order: [['startTime', 'ASC']],
      });

      return {
        statusCode: 200,
        message: 'Today sessions fetched successfully',
        data: sessions,
      };
    } catch (err) {
      console.error(err);
      throw new BadRequestException('Failed to fetch today sessions');
    }
  }

  // 3️⃣ Earnings Summary (monthly)
  async getEarningsSummary(consultantId: number) {
    try {
      const earnings = await this.payoutModel.findAll({
        attributes: [
          [fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'month'],
          [fn('SUM', col('amount')), 'totalEarnings'],
          [fn('SUM', col('platformFee')), 'platformFees'],
        ],
        where: { consultantId, status: 'TRANSFER_SENT' },
        group: ['month'],
        order: [['month', 'ASC']],
      });

      return {
        statusCode: 200,
        message: 'Earnings summary fetched successfully',
        data: earnings,
      };
    } catch (err) {
      console.error(err);
      throw new BadRequestException('Failed to fetch earnings summary');
    }
  }

  // 4️⃣ Recent Bookings
  async getRecentBookings(consultantId: number) {
    try {
      const bookings = await this.bookingModel.findAll({
        where: { consultantId },
        include: [
          { association: 'customer', attributes: ['id', 'fullName', 'email'] },
          { association: 'consultantPayout', attributes: ['amount', 'status'] },
        ],
        limit: 5,
        order: [['createdAt', 'DESC']],
      });

      return {
        statusCode: 200,
        message: 'Recent bookings fetched successfully',
        data: bookings,
      };
    } catch (err) {
      console.error(err);
      throw new BadRequestException('Failed to fetch recent bookings');
    }
  }

  // 5️⃣ Consultant Ratings
  async getRatings(consultantId: number) {
    const ratings = await this.ratingModel.findAll({
      where: { consultantId },
      include: [
        { association: 'customer', attributes: ['id', 'fullName', 'email'] }
      ],
      limit: 5,
      order: [['createdAt', 'DESC']],
    });


    const avgRating = await this.ratingModel.findOne({
      attributes: [[fn('AVG', col('rating')), 'avgRating']],
      where: { consultantId },
      raw: true,
    });

    return {
      statusCode: 200,
      message: 'Ratings fetched successfully',
      data: {
        averageRating: avgRating?.['avgRating'] ?? 0, // set 0 if null
        recentRatings: ratings,
      },
    };


  }
}
