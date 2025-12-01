import { Injectable, Logger } from "@nestjs/common";
import { RRule, RRuleSet, rrulestr } from "rrule";
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";
import { extractDtstartFromRrule, formatTime, getDtstartDate } from "src/common/helper/rrule-helper";
import { InjectModel } from "@nestjs/sequelize";
import { Booking } from "src/database/models/booking.model";
import { ConsultantSchedule } from "src/database/models/consultantSchedule.model";
import { Op } from "sequelize";

dayjs.extend(utc);
dayjs.extend(timezone);
@Injectable()
export class RruleService {
  private readonly logger = new Logger(RruleService.name);

  constructor(
    @InjectModel(Booking) private bookingModel: typeof Booking,
    @InjectModel(ConsultantSchedule) private scheduleModel: typeof ConsultantSchedule,
  ) { }

  async generateRecurringDatesFunc(
    schedule: any,
    dto: { startDate: string; endDate: string }
  ) {
    try {
      if (!schedule?.rrule) return [];

      const scheduleTZ = schedule.timezone || "UTC";

      const dtstart = extractDtstartFromRrule(schedule.rrule);
      if (isNaN(dtstart.getTime())) return [];

      const cleanedRule = schedule.rrule
        .replace("COUNT=0", "")
        .replace("INTERVAL=0", "INTERVAL=1")
        .replace(/;;+/g, ";")
        .split("\n")
        .filter((line) => !line.startsWith("DTSTART"))
        .join("\n");

      const ruleSet = rrulestr(cleanedRule, {
        dtstart,
        tzid: scheduleTZ,  // 👈 IMPORTANT
        forceset: true,
      });

      const startLocal = dayjs.tz(dto.startDate, scheduleTZ).startOf("day").toDate();
      const endLocal = dayjs.tz(dto.endDate, scheduleTZ).endOf("day").toDate();

      const occurrences = ruleSet.between(startLocal, endLocal, true);
      if (!occurrences.length) return [];

      const hours = (ruleSet as any)._rrule?.[0]?.options?.byhour || [];

      const slots: { start: string; end: string }[] = [];

      for (const occ of occurrences) {
        for (const hour of hours) {
          const start = dayjs(occ)
            .tz(scheduleTZ)
            .hour(hour)
            .minute(0)
            .second(0);

          const end = start.add(1, "hour");

          // Convert back to UTC
          slots.push({
            start: start.utc().toISOString(),
            end: end.utc().toISOString(),
          });
        }
      }

      return Array.from(
        new Map(slots.map((s) => [`${s.start}-${s.end}`, s])).values()
      );
    } catch (err) {
      this.logger.error(`RRULE generation error: ${err.message}`);
      return [];
    }
  }


  async getRruleAvailability(
    consultantId: number,
    startDate: string,
    endDate: string,
    tz?: string
  ) {
    // 1. Fetch schedules
    const schedules = await this.scheduleModel.findAll({
      where: { userId: consultantId },
    });

    let generatedAvailability: {
      date: string;
      slots: { start: string; end: string }[];
    }[] = [];

    // 2. Generate slots per schedule (using your helper)
    for (const schedule of schedules) {
      const slots = await this.generateRecurringDatesFunc(
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
        consultantId,
        bookingDate: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    const bookedSlots = existingBookings.map((b) => ({
      start: dayjs.utc(`${b.bookingDate}T${b.startTime}`).toISOString(),
      end: dayjs.utc(`${b.bookingDate}T${b.endTime}`).toISOString(),
    }));

    const array: any = [];

    generatedAvailability.forEach(({ date, slots }) => {
      slots.forEach((slot) => {
        const isBooked = bookedSlots.some(
          (b) =>
            dayjs(b.start).isSame(slot.start) && dayjs(b.end).isSame(slot.end)
        );

        const isPast = dayjs(slot.start).isBefore(dayjs());
        const isAvailable = !isBooked && !isPast;

        const startTime = formatTime(slot.start, tz);
        const endTime = formatTime(slot.end, tz);

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

        array.push({
          id: `avail-${date}-${slot.start}`,
          title: isAvailable ? "Slot Available" : "Booked Slot",
          type: isAvailable ? "available" : "booked",
          slot: `${slot.start} - ${slot.end}`,
          start: startDate,
          end: endDate,
          timeSlot,
          isAvailable,
          backgroundColor: isAvailable ? "#A7F3D0" : "#FCA5A5",
          borderColor: isAvailable ? "#34D399" : "#DC2626",
          textColor: isAvailable ? "#064E3B" : "#7F1D1D",
        });
      });
    });

    return {
      consultantId,
      startDate,
      endDate,
      availability: array,
    };
  }
}
