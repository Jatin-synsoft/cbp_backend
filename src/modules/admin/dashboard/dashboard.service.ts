import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/database/models/user.model';
import { Role } from 'src/database/models/role.model';
import { Op, fn, col } from 'sequelize';

import { Booking } from 'src/database/models/booking.model';
import { BookingTransaction } from 'src/database/models/bookingTransaction.model';
import { ConsultantPayout } from 'src/database/models/consultantPayout.model';
import { ConsultantRating } from 'src/database/models/consultantRating.model';

import { BookingStatus, BookingTransactionStatus, PayoutStatus } from 'src/common/enums/booking-status.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Role) private readonly roleModel: typeof Role,
    @InjectModel(Booking) private readonly bookingModel: typeof Booking,
    @InjectModel(BookingTransaction) private readonly transactionModel: typeof BookingTransaction,
    @InjectModel(ConsultantPayout) private readonly payoutModel: typeof ConsultantPayout,
  ) { }

  async getUserCounts() {
    try {
      const consultants = await this.userModel.count({
        include: [{ model: Role, where: { id: 2 }, through: { attributes: [] } }],
      });

      const endUsers = await this.userModel.count({
        include: [{ model: Role, where: { id: 3 }, through: { attributes: [] } }],
      });

      const totalUsers = consultants + endUsers;

      return {
        statusCode: 200,
        message: 'User counts fetched successfully',
        data: { totalUsers, consultants, endUsers },
      };
    } catch (err) {
      console.error(err);
      throw new BadRequestException('Failed to fetch user counts');
    }
  }

  async getLastUsers() {
    const users = await this.userModel.findAll({
      limit: 20,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'fullName', 'email', 'phone', 'status', 'createdAt'],
      include: [
        {
          model: Role,
          where: { id: { [Op.ne]: 1 } },
          through: { attributes: [] },
          required: true,
        },
      ],
    });


    return {
      statusCode: 200,
      message: 'Last 20 users fetched successfully',
      data: users,
    };

  }

  async getOverview() {
    const totalUsers = await this.userModel.count();

    const totalConsultants = await this.userModel.count({
      include: [{ model: this.roleModel, where: { id: 2 }, through: { attributes: [] } }],
    });

    const totalBookings = await this.bookingModel.count({
      where: { status: { [Op.notIn]: [BookingStatus.PAYMENT_FAILED, BookingStatus.PAYMENT_CANCELLED] } }
    });

    const todayBookings = await this.bookingModel.count({
      where: {
        createdAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: { [Op.ne]: BookingStatus.PAYMENT_FAILED }
      },
    });

    const totalRevenue = await this.transactionModel.sum('amount', {
      where: { status: BookingTransactionStatus.PAYMENT_SUCCESS },
    });

    const totalConsultantEarnings = await this.payoutModel.sum('amount', {
      where: { status: PayoutStatus.TRANSFER_SENT },
    });

    const totalPlatformEarnings = await this.payoutModel.sum('platformFee', {
      where: { status: PayoutStatus.TRANSFER_SENT },
    });

    return {
      statusCode: 200,
      message: 'Dashboard overview fetched successfully',
      data: {
        totalUsers,
        totalConsultants,
        totalBookings,
        todayBookings,
        totalRevenue: totalRevenue || 0,
        totalConsultantEarnings: totalConsultantEarnings || 0,
        totalPlatformEarnings: totalPlatformEarnings || 0,
      },
    };
  }

  async getRecentBookings() {
    const bookings = await this.bookingModel.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        { model: this.userModel, as: 'customer', attributes: ['id', 'fullName'] },
        { model: this.userModel, as: 'consultant', attributes: ['id', 'fullName'] },
      ],
    });

    return {
      statusCode: 200,
      message: 'Recent bookings fetched successfully',
      data: bookings,
    };
  }

  async getRecentUsers() {
    const users = await this.userModel.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: Role, through: { attributes: [] } }],
    });

    return {
      statusCode: 200,
      message: 'Recent users fetched successfully',
      data: users,
    };
  }

  async getEarningsSummary() {
    const monthly = await this.transactionModel.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'month'],
        [fn('SUM', col('amount')), 'total'],
      ],
      where: { status: BookingTransactionStatus.PAYMENT_SUCCESS },
      group: ['month'],
      order: [['month', 'ASC']],
    });

    return {
      statusCode: 200,
      message: 'Earnings summary fetched successfully',
      data: monthly,
    };
  }

  // ---------------------------------------
  // 7. Top Consultants (By Payouts)
  // ---------------------------------------
  async getTopConsultants() {
    const consultants = await this.userModel.findAll({
      include: [
        { model: Role, where: { id: 2 }, through: { attributes: [] } },
        {
          model: this.payoutModel,
          attributes: ['amount'],
          where: { status: PayoutStatus.TRANSFER_SENT },
          required: false,
        },
      ],
    });

    const result = consultants
      .map((c) => {
        const earnings = c.payouts?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

        return {
          id: c.id,
          fullName: c.fullName,
          email: c.email,
          earnings,
        };
      })
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);

    return {
      statusCode: 200,
      message: 'Top consultants fetched successfully',
      data: result,
    };
  }
}
