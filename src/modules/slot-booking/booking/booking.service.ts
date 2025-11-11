import { BadRequestException, Injectable } from '@nestjs/common';
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

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(minMax);
@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking) private bookingModel: typeof Booking,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(ConsultantSchedule) private scheduleModel: typeof ConsultantSchedule,
    private rruleService: RruleService,
    private sequelize: Sequelize,
    private mailService: MailService
  ) { }

  // async createBooking(bookingDto: CreateBookingDto, userId: number) {
  //   const transaction = await this.sequelize.transaction();
  //   try {
  //     const { consultantId, bookingDate, startTime, endTime, notes, scheduleDate } = bookingDto;

  //     const tz = "UTC";
  //     const slotStart = dayjs.tz(`${scheduleDate} ${startTime.split(":")[0]}`, "YYYY-MM-DD HH:mm", tz);

  //     const slotEnd = dayjs.tz(`${scheduleDate} ${endTime.split(":")[0]}`, "YYYY-MM-DD HH:mm", tz)


  //     const checkSlots = await this.rruleService.getRruleAvailability(
  //       consultantId,
  //       slotStart.format("YYYY-MM-DD"),
  //       slotEnd.add(1, "day").format("YYYY-MM-DD"),
  //       tz
  //     );


  //     const slot = checkSlots.availability.find((item) => {
  //       const [start] = item.slot.split(" - ");
  //       const dateObj = new Date(start);

  //       const date = dateObj.toISOString().split("T")[0];
  //       const time = dateObj.toISOString().split("T")[1].slice(0, 5);

  //       return (
  //         date === slotStart.format("YYYY-MM-DD") &&
  //         time === startTime &&
  //         item.isAvailable
  //       );
  //     });


  //     if (!slot) {
  //       console.log("Slot not available");
  //       return {
  //         isValid: false,
  //         conflicts: [],
  //       };
  //     }

  //     const booking = await this.bookingModel.create(
  //       {
  //         consultantId,
  //         customerId: userId,
  //         scheduleDate: slotStart.toDate(),
  //         bookingDate: new Date(bookingDate),
  //         startTime: slotStart.format("HH:mm"),
  //         endTime: slotEnd.format("HH:mm"),
  //         notes,
  //         status: BookingStatus.CONFIRMED,
  //       },
  //       { transaction }
  //     );

  //     await transaction.commit();

  //     return {
  //       isValid: true,
  //       booking,
  //       message: "Booking created successfully",
  //     };

  //   } catch (error) {
  //     await transaction.rollback();
  //     throw error;
  //   }
  // }

  async createBooking(bookingDto: CreateBookingDto, userId: number) {
    const transaction = await this.sequelize.transaction();
    try {
      const { consultantId, bookingDate, startTime, endTime, notes, scheduleDate } = bookingDto;

      const tz = "UTC";
      const slotStart = dayjs.tz(`${scheduleDate} ${startTime.split(":")[0]}`, "YYYY-MM-DD HH:mm", tz);
      const slotEnd = dayjs.tz(`${scheduleDate} ${endTime.split(":")[0]}`, "YYYY-MM-DD HH:mm", tz);

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
        console.log("Slot not available");
        return { isValid: false, conflicts: [] };
      }

      const booking = await this.bookingModel.create(
        {
          consultantId,
          customerId: userId,
          scheduleDate: slotStart.toDate(),
          bookingDate: new Date(bookingDate),
          startTime: slotStart.format("HH:mm"),
          endTime: slotEnd.format("HH:mm"),
          notes,
          status: BookingStatus.CONFIRMED,
        },
        { transaction }
      );

      await transaction.commit();

      const user = await this.userModel.findByPk(userId);
      const consultant = await this.userModel.findByPk(consultantId);

      const formattedDate = dayjs(scheduleDate).format("MMM D, YYYY");
      const slotTime = `${startTime} - ${endTime}`;

      // this.mailService.sendMailTemplate({
      //   to: user.email,
      //   templateName: "booking-received-user.html",
      //   context: {
      //     fullName: user.fullName,
      //     consultantName: consultant.fullName,
      //     bookingDate: formattedDate,
      //     slotTime,
      //     dashboardUrl: `${process.env.FRONTEND_URL}/user/bookings`,
      //     year: new Date().getFullYear(),
      //   },
      //   sendAsync: true,
      // });

      this.mailService.sendMailTemplate({
        to: consultant.email,
        templateName: "booking-received-consultant.html",
        context: {
          consultantName: consultant.fullName,
          userFullName: user.fullName,
          userEmail: user.email,
          bookingDate: formattedDate,
          slotTime,
          consultantDashboardUrl: `${process.env.FRONTEND_URL}/consultant/bookings`,
          year: new Date().getFullYear(),
        },
        sendAsync: true,
      });

      return {
        isValid: true,
        booking,
        message: "Booking created successfully",
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

    if (roles.includes(2)) {
      where.consultantId = userId;

      include.push({
        model: this.userModel,
        as: 'customer',
        attributes: ['id', 'fullName', 'email', 'phone'],
      });
    } else if (roles.includes(3)) {
      where.customerId = userId;

      include.push({
        model: this.userModel,
        as: 'consultant',
        attributes: ['id', 'fullName', 'email', 'phone'],
      });
    } else {
      throw new BadRequestException('Invalid role');
    }

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
