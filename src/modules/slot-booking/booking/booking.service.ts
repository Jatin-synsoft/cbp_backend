import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Booking } from 'src/database/models/booking.model';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from "sequelize-typescript";
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";
import * as minMax from "dayjs/plugin/minMax";
import { BookingStatus } from 'src/common/enums/booking-status.enum';
import { RruleService } from 'src/services/rrule.service';
import { PaginationDto } from './dto/pagination.dto';
import { User } from 'src/database/models/user.model';
import { ConsultantSchedule } from 'src/database/models/consultantSchedule.model';
import { paginate } from 'src/common/utils/pagination.util';
import { MailService } from 'src/modules/mail/mail-sendgrid.service';
import { StripeService } from 'src/stripe/stripe.service';
import { Profile } from 'src/database/models/profile.model';
import { Currency } from 'src/database/models/currencies.model';
import { BookingTransaction } from 'src/database/models/bookingTransaction.model';
import { StripeAccountStatus } from 'src/common/enums/account-status.enum';
import { ConsultantPayout } from 'src/database/models/consultantPayout.model';
import { ConsultantRating } from 'src/database/models/consultantRating.model';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(minMax);
@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking) private bookingModel: typeof Booking,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Profile) private profileModel: typeof Profile,
    @InjectModel(Currency) private currencyModel: typeof Currency,
    @InjectModel(BookingTransaction) private bookingTransactionModel: typeof BookingTransaction,
    @InjectModel(ConsultantPayout) private payoutModel: typeof ConsultantPayout,
    @InjectModel(ConsultantRating) private ratingModel: typeof ConsultantRating,
    private rruleService: RruleService,
    private sequelize: Sequelize,
    private stripeService: StripeService,
  ) { }

  async createBooking(bookingDto: CreateBookingDto, userId: number) {
    const transaction = await this.sequelize.transaction();

    try {
      const { consultantId, bookingDate, startTime, endTime, notes, scheduleDate } = bookingDto;

      const consultant = await this.userModel.findOne({
        where: { id: consultantId },
        include: [
          {
            model: this.profileModel,
            attributes: ['id', 'hourlyRate', 'currencyId', 'stripeAccountId', 'stripeAccountStatus'],
            include: [{
              model: this.currencyModel,
              attributes: ['id', 'code']
            }],
          },
        ]
      });

      if (!consultant) throw new BadRequestException('Invalid Consultant');
      if (consultant.profile.stripeAccountStatus !== StripeAccountStatus.VERIFIED)
        throw new BadRequestException('Stripe account not verified');

      const consultantAccountId = consultant.profile.stripeAccountId;
      const currencyCode = consultant.profile.currency.code;

      const hourlyRate = consultant.profile.hourlyRate;

      const platformFeePercent = Number(process.env.PLATFORM_FEE) || 0;

      const platformFeeAmount = (hourlyRate * platformFeePercent) / 100;

      const amount = +hourlyRate + +platformFeeAmount;

      const bookingAmount = amount * 100;

      const tz = "UTC";
      const slotStart = dayjs.tz(`${scheduleDate} ${startTime}`, "YYYY-MM-DD HH:mm", tz);
      const slotEnd = dayjs.tz(`${scheduleDate} ${endTime}`, "YYYY-MM-DD HH:mm", tz);

      // 1️⃣ Check availability
      const checkSlots = await this.rruleService.getRruleAvailability(
        consultantId,
        slotStart.format("YYYY-MM-DD"),
        slotEnd.add(1, "day").format("YYYY-MM-DD"),
        tz
      );

      const slot = checkSlots.availability.find((item) => {
        const [start] = item.slot.split(" - ");
        const dateObj = new Date(start);
        const date = dateObj.toISOString().split("T")[0];
        const time = dateObj.toISOString().split("T")[1].slice(0, 5);

        return (
          date === slotStart.format("YYYY-MM-DD") &&
          time === startTime &&
          item.isAvailable
        );
      });

      if (!slot) {
        return { isValid: false, conflicts: [] };
      }

      // 2️⃣ Create booking
      const booking = await this.bookingModel.create(
        {
          consultantId,
          customerId: userId,
          scheduleDate: slotStart.toDate(),
          bookingDate: new Date(bookingDate),
          startTime: slotStart.format("HH:mm"),
          endTime: slotEnd.format("HH:mm"),
          currencyId: consultant.profile.currency.id,
          notes,
          amount
        },
        { transaction }
      );

      // 3️⃣ Create Stripe payment intent (split payment)
      const stripeResp = await this.stripeService.createSplitPaymentIntent(
        consultantAccountId,
        bookingAmount,
        currencyCode
      );

      // 4️⃣ Save transaction record
      await this.bookingTransactionModel.create(
        {
          bookingId: booking.id,
          paymentIntentId: stripeResp.paymentIntentId,
          transactionId: null,
          currencyId: consultant.profile.currency.id,
          amount
        },
        { transaction }
      );

      await transaction.commit();

      return {
        isValid: true,
        message: "Booking created successfully",
        booking,
        clientSecret: stripeResp.clientSecret
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }


  async findAllBookings(user: any, query: PaginationDto) {
    let { page = 1, limit = 10, search = '', status } = query;
    const { roles, id: userId } = user;

    const where: any = {};
    const include: any[] = [];

    // ----------------------
    // ADMIN → See ALL bookings
    // ----------------------
    if (roles.includes(1)) {

      include.push(
        {
          model: this.userModel,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phone'],
        },
        {
          model: this.userModel,
          as: 'consultant',
          attributes: ['id', 'fullName', 'email', 'phone'],
        },
        {
          model: this.payoutModel,
          as: "consultantPayout",
          attributes: [
            "id",
            "amount",
            "platformFee",
            "status",
            "createdAt"
          ],
          include: [
            {
              model: this.currencyModel,
              as: "currency",
              attributes: ["id", "code", "symbol"]
            }
          ]
        },
        {
          model: this.ratingModel,
          as: 'rating',
          attributes: ['rating', 'note'],
        }
      );

    }

    // ----------------------
    // CONSULTANT → Own bookings
    // ----------------------
    else if (roles.includes(2)) {
      where.consultantId = userId;

      include.push(
        {
          model: this.userModel,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phone'],
        },
        {
          model: this.payoutModel,
          as: "consultantPayout",
          attributes: [
            "id",
            "amount",
            "platformFee",
            "status",
            "createdAt"
          ],
          include: [
            {
              model: this.currencyModel,
              as: "currency",
              attributes: ["id", "code", "symbol"]
            }
          ]
        },
        {
          model: this.ratingModel,
          as: 'rating',
          attributes: ['rating', 'note'],
        }
      );
    }

    // ----------------------
    // CUSTOMER → Own bookings
    // ----------------------
    else if (roles.includes(3)) {
      where.customerId = userId;

      include.push({
        model: this.userModel,
        as: 'consultant',
        attributes: ['id', 'fullName', 'email', 'phone'],
      });
    }

    else {
      throw new BadRequestException('Invalid role');
    }

    // ----------------------
    // SEARCH
    // ----------------------
    if (search) {
      if (roles.includes(2)) {
        where[Op.or] = [
          { '$customer.fullName$': { [Op.like]: `%${search}%` } },
          { '$customer.email$': { [Op.like]: `%${search}%` } },
        ];
      } else if (roles.includes(3)) {
        where[Op.or] = [
          { '$consultant.fullName$': { [Op.like]: `%${search}%` } },
          { '$consultant.email$': { [Op.like]: `%${search}%` } },
        ];
      } else if (roles.includes(1)) {
        // Admin search both
        where[Op.or] = [
          { '$customer.fullName$': { [Op.like]: `%${search}%` } },
          { '$customer.email$': { [Op.like]: `%${search}%` } },
          { '$consultant.fullName$': { [Op.like]: `%${search}%` } },
          { '$consultant.email$': { [Op.like]: `%${search}%` } },
        ];
      }
    }

    if (status) where.status = status;

    const result = await paginate(
      this.bookingModel,
      { page, limit },
      include,
      where,
    );

    return {
      statusCode: 200,
      message: 'Bookings fetched successfully',
      data: result,
    };
  }

  async findBookingById(user: any, bookingId: number) {
    const { roles, id: userId } = user;

    const where: any = { id: bookingId };
    const include: any[] = [];

    // ---------------------------------
    // ADMIN → Full access
    // ---------------------------------
    if (roles.includes(1)) {
      include.push(
        {
          model: this.userModel,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phone'],
        },
        {
          model: this.userModel,
          as: 'consultant',
          attributes: ['id', 'fullName', 'email', 'phone'],
        },
        {
          model: this.payoutModel,
          as: "consultantPayout",
          attributes: [
            "id", "amount", "platformFee", "status", "createdAt"
          ],
          include: [
            {
              model: this.currencyModel,
              as: "currency",
              attributes: ["id", "code", "symbol"]
            }
          ]
        },
        {
          model: this.ratingModel,
          as: 'rating',
          attributes: ['rating', 'note'],
        }
      );
    }

    // ---------------------------------
    // CONSULTANT → Can see own bookings
    // ---------------------------------
    else if (roles.includes(2)) {
      where.consultantId = userId;

      include.push(
        {
          model: this.userModel,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phone'],
        },
        {
          model: this.payoutModel,
          as: "consultantPayout",
          attributes: [
            "id", "amount", "platformFee", "status", "createdAt"
          ],
          include: [
            {
              model: this.currencyModel,
              as: "currency",
              attributes: ["id", "code", "symbol"]
            }
          ]
        },
        {
          model: this.ratingModel,
          as: 'rating',
          attributes: ['rating', 'note'],
        }
      );
    }

    // ---------------------------------
    // CUSTOMER → Can see own bookings
    // ---------------------------------
    else if (roles.includes(3)) {
      where.customerId = userId;

      include.push({
        model: this.userModel,
        as: 'consultant',
        attributes: ['id', 'fullName', 'email', 'phone'],
      });
    }

    else {
      throw new BadRequestException('Invalid role');
    }

    // ---------------------------------
    // Fetch booking
    // ---------------------------------
    const booking = await this.bookingModel.findOne({
      where,
      include,
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or access denied');
    }

    return {
      statusCode: 200,
      message: 'Booking fetched successfully',
      data: booking,
    };
  }

  async checkSlotAvailability(consultantId: number, bookingDate: Date, startTime: string, endTime: string, transaction: Transaction) {
    const tz = "UTC";

    const slotStart = dayjs.tz(
      `${dayjs(bookingDate).format("YYYY-MM-DD")} ${startTime}`,
      "YYYY-MM-DD HH:mm",
      tz
    );
    const slotEnd = dayjs.tz(
      `${dayjs(bookingDate).format("YYYY-MM-DD")} ${endTime}`,
      "YYYY-MM-DD HH:mm",
      tz
    );

    const conflicts = await this.bookingModel.findAll({
      where: {
        consultantId,
        bookingDate: {
          [Op.eq]: dayjs(bookingDate).startOf("day").toDate(),
        },
        [Op.or]: [
          {
            startTime: { [Op.lt]: slotEnd.format("HH:mm") },
            endTime: { [Op.gt]: slotStart.format("HH:mm") },
          },
        ],
        status: { [Op.ne]: BookingStatus.CANCELLED },
      },
      transaction,
    });

    if (conflicts.length > 0) {
      const conflictStrings = conflicts.map((c) => {
        const dateStr = dayjs(c.bookingDate).format("dddd");
        return `${dateStr} ${c.startTime.slice(0, 5)}-${c.endTime.slice(0, 5)}`;
      });

      return {
        isValid: false,
        conflicts: conflictStrings,
      };
    }

    return { isValid: true, conflicts: [] };
  }
}
