import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Booking } from 'src/database/models/booking.model';
import { BookingTransaction } from 'src/database/models/bookingTransaction.model';
import { ConsultantPayout } from 'src/database/models/consultantPayout.model';
import { ConsultantRating } from 'src/database/models/consultantRating.model';
import { Op, fn, col } from 'sequelize';
import { Currency } from 'src/database/models/currencies.model';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Booking) private readonly bookingModel: typeof Booking,
    @InjectModel(BookingTransaction) private readonly transactionModel: typeof BookingTransaction,
    @InjectModel(ConsultantPayout) private readonly payoutModel: typeof ConsultantPayout,
    @InjectModel(ConsultantRating) private readonly ratingModel: typeof ConsultantRating,
    @InjectModel(Currency) private readonly currencyModel: typeof Currency
  ) { }

  async getOverview(consultantId: number) {
    const totalBookings = await this.bookingModel.count({ where: { consultantId } });
    const completedBookings = await this.bookingModel.count({
      where: { consultantId, status: 'COMPLETED' },
    });
    const confirmedBookings = await this.bookingModel.count({
      where: { consultantId, status: { [Op.in]: ['CONFIRMED'] } },
    });
    const totalEarnings = await this.payoutModel.findOne({
      attributes: [
        [fn('SUM', col('ConsultantPayout.amount')), 'amount'],
      ],

      where: { consultantId, status: 'TRANSFER_SENT' },

      include: [
        {
          model: this.currencyModel,
          as: 'currency',
          attributes: ['code', 'symbol'],
        },
      ],

      group: ['currency.id'],

    });


    return {
      statusCode: 200,
      message: 'Consultant overview fetched successfully',
      data: { totalBookings, completedBookings, confirmedBookings, totalEarnings: { amount: totalEarnings?.amount ?? 0, symbol: totalEarnings?.currency.symbol } },
    };

  }

  async getTodaySessions(consultantId: number) {
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

  }

  async getEarningsSummary(consultantId: number) {
    try {
      const earnings = await this.payoutModel.findAll({
        attributes: [
          [
            fn('DATE_FORMAT', col('ConsultantPayout.createdAt'), '%Y-%m'),
            'month',
          ],
          [fn('SUM', col('ConsultantPayout.amount')), 'totalEarnings'],
          // [fn('SUM', col('ConsultantPayout.platformFee')), 'platformFees'],
        ],

        where: { consultantId, status: 'TRANSFER_SENT' },

        include: [
          {
            model: this.currencyModel,
            as: 'currency',
            attributes: ['code', 'symbol'],
          },
        ],

        group: [
          fn('DATE_FORMAT', col('ConsultantPayout.createdAt'), '%Y-%m'),
          'currency.id',
        ],

        order: [
          [fn('DATE_FORMAT', col('ConsultantPayout.createdAt'), '%Y-%m'), 'ASC'],
        ],
      });

      return {
        statusCode: 200,
        message: 'Earnings summary fetched successfully',
        data: earnings[0],
      };
    } catch (err) {
      console.error(err);
      throw new BadRequestException('Failed to fetch earnings summary');
    }
  }

  async getRecentBookings(consultantId: number) {
    const bookings = await this.bookingModel.findAll({
      where: { consultantId, status: { [Op.in]: ['CONFIRMED'] } },
      include: [
        { association: 'customer', attributes: ['id', 'fullName', 'email'] },
        { association: 'consultantPayout', attributes: ['amount', 'status'] },
        { association: 'currency', attributes: ['code', 'symbol'] },
      ],
      limit: 5,
      order: [['createdAt', 'DESC']],
    });

    return {
      statusCode: 200,
      message: 'Recent bookings fetched successfully',
      data: bookings,
    };

  }

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
