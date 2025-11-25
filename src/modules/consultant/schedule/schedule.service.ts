import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRoles } from 'src/database/models/userRoles.model';
import { ConsultantDocument } from 'src/database/models/consultantDocuments.model';
import { ConsultantSpecialty } from 'src/database/models/consultantSpecialties.model';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/database/models/user.model';
import { Profile } from 'src/database/models/profile.model';
import { Role } from 'src/database/models/role.model';
import { SpecialtiesMst } from 'src/database/models/specialtiesMst.model';
import { paginate } from 'src/common/utils/pagination.util';
import { Currency } from 'src/database/models/currencies.model';
import { ConsultantSchedule } from 'src/database/models/consultantSchedule.model';
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";
import { formatTime } from 'src/common/helper/rrule-helper';
import { Op } from 'sequelize';
import { RruleService } from 'src/services/rrule.service';
import { Booking } from 'src/database/models/booking.model';
import { RRule, RRuleSet, rrulestr } from 'rrule';
import { frequencyMap } from 'src/common/enums/frequency';
import { weekDays } from 'src/common/enums/dayofweeek.enum';
import { GetAvailabilityDto, ScheduleDto } from './dto/schedule.dto';
import { BookingStatus } from 'src/common/enums/booking-status.enum';
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class ScheduleService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Profile) private profileModel: typeof Profile,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(UserRoles) private userRoleModel: typeof UserRoles,
    @InjectModel(ConsultantDocument) private documentModel: typeof ConsultantDocument,
    @InjectModel(ConsultantSpecialty) private specialtyModel: typeof ConsultantSpecialty,
    @InjectModel(SpecialtiesMst) private specialtymasterModel: typeof SpecialtiesMst,
    @InjectModel(Currency) private currencyModel: typeof Currency,
    @InjectModel(ConsultantSchedule) private scheduleModel: typeof ConsultantSchedule,
    @InjectModel(Booking) private bookingModel: typeof Booking,
    private readonly rruleService: RruleService
  ) { }

  async createSchedule(dto: ScheduleDto, userId: number) {
    const consultant = await this.userModel.findByPk(userId);
    if (!consultant) throw new NotFoundException('Consultant not found');

    // 🆕 Parse new schedule start and end dates
    const newRule = rrulestr(dto.rrule);
    const newStart = dayjs(newRule.options.dtstart);
    const newEnd = dayjs(newRule.options.until);

    // 📚 Fetch existing consultant schedules
    const existingSchedules = await this.scheduleModel.findAll({ where: { userId } });

    for (const existing of existingSchedules) {
      const existingRule = rrulestr(existing.rrule);
      const existingStart = dayjs(existingRule.options.dtstart);
      const existingEnd = dayjs(existingRule.options.until);

      // ✅ Check if the date ranges overlap (ignore time)
      const isOverlap =
        newStart.isBefore(existingEnd.add(1, 'day')) &&
        newEnd.isAfter(existingStart.subtract(1, 'day'));

      if (isOverlap) {
        const overlapStart = existingStart.tz('Asia/Kolkata').format('DD MMM YYYY');
        const overlapEnd = existingEnd.tz('Asia/Kolkata').format('DD MMM YYYY');

        throw new BadRequestException({
          message: `⚠️ Schedule overlap detected: You already have a schedule between ${overlapStart} and ${overlapEnd}. Please adjust your dates.`,
          existingScheduleId: existing.id,
        });
      }
    }

    // ✅ No overlap → Create schedule
    await this.scheduleModel.create({ ...dto, userId });
    return { message: '✅ Consultant schedule created successfully' };
  }

  async updateSchedule(scheduleId: number, dto: ScheduleDto, userId: number) {
    const consultant = await this.userModel.findByPk(userId);
    if (!consultant) {
      throw new NotFoundException('Consultant not found');
    }

    const schedule = await this.scheduleModel.findOne({
      where: { id: scheduleId, userId },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found or not owned by this consultant');
    }

    await schedule.update(dto);

    return {
      message: 'Consultant schedule updated successfully',
    };
  }

  async getConsultantAvailability(userId: number, query: GetAvailabilityDto) {
    const { startDate, endDate, timezone } = query;
    const userTZ = timezone || "UTC";

    // 1. Fetch schedules
    const schedules = await this.scheduleModel.findAll({
      where: { userId },
    });

    let generatedAvailability: {
      date: string;
      slots: { start: string; end: string }[];
    }[] = [];

    // 2. Generate slots per schedule (using your helper)
    for (const schedule of schedules) {
      const slots = await this.rruleService.generateRecurringDatesFunc(
        schedule,
        { startDate, endDate }
      );

      for (const slot of slots) {
        const date = slot.start.split("T")[0]; // YYYY-MM-DD

        let daySlot = generatedAvailability.find((d) => d.date === date);
        if (!daySlot) {
          daySlot = { date, slots: [] };
          generatedAvailability.push(daySlot);
        }

        daySlot.slots.push(slot);
      }
    }

    // 3. Fetch existing bookings for provider in range
    const existingBookings = await this.bookingModel.findAll({
      where: {
        status: BookingStatus.CONFIRMED,
        consultantId: userId,
        scheduleDate: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    const bookedSlots = existingBookings.map((b) => ({
      start: dayjs.utc(`${b.scheduleDate}T${b.startTime}`).toISOString(),
      end: dayjs.utc(`${b.scheduleDate}T${b.endTime}`).toISOString(),
    }));

    const array: any = [];

    generatedAvailability.forEach(({ date, slots }) => {

      slots.forEach((slot) => {
        const isExpired = dayjs.tz(slot.end, userTZ).isBefore(dayjs().tz(userTZ));
        const isBooked = bookedSlots.some(
          (b) =>
            dayjs(b.start).isSame(slot.start) && dayjs(b.end).isSame(slot.end)
        );

        // const isPast = dayjs(slot.start).isBefore(dayjs());
        const isAvailable = !isBooked && !isExpired;

        const startTime = formatTime(slot.start);
        const endTime = formatTime(slot.end);

        const startDate = dayjs(
          `${date} ${startTime}`,
          "YYYY-MM-DD hh:mm A"
        ).toISOString();
        const endDate = dayjs(
          `${date} ${endTime}`,
          "YYYY-MM-DD hh:mm A"
        ).toISOString();

        const timeSlot = `${slot.start.split("T")[1].slice(0, 5)}-${slot.end
          .split("T")[1]
          .slice(0, 5)}`;

        // array.push({
        //   id: `avail-${date}-${slot.start}`,
        //   title: isAvailable ? "Slot Available" : "Booked Slot",
        //   type: isAvailable ? "available" : "booked",
        //   slot: `${slot.start} - ${slot.end}`,
        //   start: startDate,
        //   end: endDate,
        //   timeSlot,
        //   isAvailable,
        //   backgroundColor: isAvailable ? "#A7F3D0" : "#FCA5A5",
        //   borderColor: isAvailable ? "#34D399" : "#DC2626",
        //   textColor: isAvailable ? "#064E3B" : "#7F1D1D",
        // });
        array.push({
          id: `avail-${date}-${slot.start}`,
          title: isBooked
            ? "Booked Slot"
            : isExpired
              ? "Expired Slot"
              : "Slot Available",
          type: isBooked
            ? "booked"
            : isExpired
              ? "expired"
              : "available",
          slot: `${slot.start} - ${slot.end}`,
          start: startDate,
          end: endDate,
          timeSlot,
          isAvailable,
          backgroundColor: isBooked
            ? "#FCA5A5"
            : isExpired
              ? "#E5E7EB"
              : "#A7F3D0",
          borderColor: isBooked
            ? "#DC2626"
            : isExpired
              ? "#9CA3AF"
              : "#34D399",
          textColor: isBooked
            ? "#7F1D1D"
            : isExpired
              ? "#6B7280"
              : "#064E3B",
        });


      });



    });

    return {
      userId,
      startDate,
      endDate,
      availability: array,
    };
  }
  // async getConsultantAvailability(userId: number, query: GetAvailabilityDto) {
  //   const { startDate, endDate } = query;

  //   // 1. Fetch schedules
  //   const schedules = await this.scheduleModel.findAll({ where: { userId } });

  //   let generatedAvailability: {
  //     date: string;
  //     slots: { start: string; end: string }[];
  //   }[] = [];

  //   // 2. Generate slots per schedule (already returns IST times)
  //   for (const schedule of schedules) {
  //     const slots = await this.rruleService.generateRecurringDatesFunc(schedule, {
  //       startDate,
  //       endDate,
  //     });

  //     for (const slot of slots) {
  //       const date = dayjs(slot.start).format('YYYY-MM-DD');

  //       let daySlot = generatedAvailability.find((d) => d.date === date);
  //       if (!daySlot) {
  //         daySlot = { date, slots: [] };
  //         generatedAvailability.push(daySlot);
  //       }

  //       daySlot.slots.push(slot);
  //     }
  //   }

  //   // 3. Fetch existing bookings (convert to IST)
  //   const existingBookings = await this.bookingModel.findAll({
  //     where: {
  //       consultantId: userId,
  //       scheduleDate: { [Op.between]: [startDate, endDate] },
  //     },
  //   });

  //   const bookedSlots = existingBookings.map((b) => ({
  //     start: dayjs.tz(`${b.scheduleDate}T${b.startTime}`, 'Asia/Kolkata').format(),
  //     end: dayjs.tz(`${b.scheduleDate}T${b.endTime}`, 'Asia/Kolkata').format(),
  //   }));

  //   const array: any[] = [];

  //   generatedAvailability.forEach(({ date, slots }) => {
  //     slots.forEach((slot) => {
  //       const isBooked = bookedSlots.some(
  //         (b) => dayjs(b.start).isSame(slot.start) && dayjs(b.end).isSame(slot.end)
  //       );

  //       const isPast = dayjs(slot.start).isBefore(dayjs());
  //       const isAvailable = !isBooked && !isPast;

  //       const startTime = formatTime(slot.start);
  //       const endTime = formatTime(slot.end);

  //       const startIso = dayjs(`${date} ${startTime}`, 'YYYY-MM-DD hh:mm A')
  //         .tz('Asia/Kolkata')
  //         .format();
  //       const endIso = dayjs(`${date} ${endTime}`, 'YYYY-MM-DD hh:mm A')
  //         .tz('Asia/Kolkata')
  //         .format();

  //       const timeSlot = `${dayjs(slot.start).format('HH:mm')}-${dayjs(
  //         slot.end
  //       ).format('HH:mm')}`;

  //       array.push({
  //         id: `avail-${date}-${slot.start}`,
  //         title: isAvailable ? 'Slot Available' : 'Booked Slot',
  //         type: isAvailable ? 'available' : 'booked',
  //         slot: `${slot.start} - ${slot.end}`,
  //         start: startIso,
  //         end: endIso,
  //         timeSlot,
  //         isAvailable,
  //         backgroundColor: isAvailable ? '#A7F3D0' : '#FCA5A5',
  //         borderColor: isAvailable ? '#34D399' : '#DC2626',
  //         textColor: isAvailable ? '#064E3B' : '#7F1D1D',
  //       });
  //     });
  //   });

  //   return {
  //     userId,
  //     startDate,
  //     endDate,
  //     availability: array,
  //   };
  // }
  async getSchedules(userId: number) {
    try {
      const schedules = await this.scheduleModel.findAll({
        where: { userId },
      });

      const providerSchedules = schedules.map((schedule) => {
        const rrule = rrulestr(schedule.rrule);
        const options = rrule.options;
        const startDate = options.dtstart;
        const endDate = options.until;
        const availableDays = options.byweekday?.map((d) => weekDays[d]);
        const availableHours = options.byhour;
        const freq = frequencyMap[options.freq];

        return {
          id: schedule.id,
          startDate,
          endDate,
          availableDays,
          availableHours,
          freq,
        };
      });

      return { message: 'Schedules fetched successfully', data: providerSchedules };
    } catch (error) {
      throw error;
    }
  }
}
