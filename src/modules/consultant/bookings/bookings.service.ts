import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateBookingStatusDto } from './dto/update-booking.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Booking } from 'src/database/models/booking.model';
import { BookingStatus } from 'src/common/enums/booking-status.enum';
import { MailService } from 'src/modules/mail/mail-sendgrid.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking)
    private readonly bookingModel: typeof Booking,
    private readonly mailService: MailService
  ) { }

  // async updateBookingStatus(id: number, dto: UpdateBookingStatusDto) {
  //   const booking = await this.bookingModel.findByPk(id, {
  //     include: ['customer'],
  //   });

  //   if (!booking) throw new NotFoundException('Booking not found');

  //   const allowedStatuses = [
  //     BookingStatus.CONFIRMED,
  //     BookingStatus.RESCHEDULED,
  //     BookingStatus.COMPLETED,
  //   ];

  //   if (!allowedStatuses.includes(booking.status)) {
  //     throw new BadRequestException(
  //       `You cannot update booking when status is ${booking.status}`
  //     );
  //   }

  //   const meetingLinkUpdated =
  //     dto.meetingLink && dto.meetingLink !== booking.meetingLink;

  //   const movedToCompleted =
  //     dto.status === BookingStatus.COMPLETED &&
  //     booking.status !== BookingStatus.COMPLETED;

  //   if (dto.status) {
  //     booking.status = dto.status;
  //   }

  //   if (dto.meetingLink) {
  //     booking.meetingLink = dto.meetingLink;
  //   }

  //   await booking.save();

  //   if (meetingLinkUpdated) {
  //     const messageText = meetingLinkUpdated
  //       ? 'Your meeting link has been updated by your consultant on Boardtide.'
  //       : 'Your consultant has shared a meeting link for your upcoming session through Boardtide.';

  //     await this.mailService.sendMailTemplate({
  //       to: booking.customer.email,
  //       templateName: 'meeting-link.html',
  //       context: {
  //         fullName: booking.customer.fullName,
  //         scheduleDate: booking.scheduleDate,
  //         slot: `${booking.startTime.slice(0, 5)} - ${booking.endTime.slice(0, 5)}`,
  //         meetingLink: booking.meetingLink,
  //         messageText,
  //         year: new Date().getFullYear(),
  //       },
  //       sendAsync: true,
  //     });
  //   }

  //   if (movedToCompleted) {
  //     await this.mailService.sendMailTemplate({
  //       to: booking.customer.email,
  //       templateName: 'booking-complete.html',
  //       context: {
  //         fullName: booking.customer.fullName,
  //         feedbackLink: `${process.env.FRONTEND_URL}/user/my-bookings`,
  //         year: new Date().getFullYear(),
  //       },
  //       sendAsync: true,
  //     });
  //   }

  //   return {
  //     message: 'Booking updated successfully',
  //     data: {
  //       status: booking.status,
  //       meetingLink: booking.meetingLink,
  //     },
  //   };
  // }


  async updateBookingStatus(id: number, dto: UpdateBookingStatusDto) {
    const booking = await this.bookingModel.findByPk(id, {
      include: ['customer'],
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const allowedStatuses = [
      BookingStatus.CONFIRMED,
      BookingStatus.RESCHEDULED,
      BookingStatus.COMPLETED,
    ];

    if (!allowedStatuses.includes(booking.status)) {
      throw new BadRequestException(
        `You cannot update booking when status is ${booking.status}`
      );
    }

    // ---- 🎯 DATE + TIME VALIDATION ----
    const bookingDateTime = new Date(
      `${booking.scheduleDate}T${booking.startTime}`
    );
    const now = new Date();

    // FUTURE session → allow only RESCHEDULE
    if (bookingDateTime > now) {
      if (dto.status === BookingStatus.COMPLETED) {
        throw new BadRequestException(
          `You cannot complete this booking because the session has not happened yet.`
        );
      }
    }

    // PAST session → allow COMPLETED + RESCHEDULE only
    if (bookingDateTime <= now) {
      if (
        dto.status &&
        ![BookingStatus.COMPLETED, BookingStatus.RESCHEDULED].includes(
          dto.status
        )
      ) {
        throw new BadRequestException(
          `Only COMPLETED or RESCHEDULED are allowed after session time has passed.`
        );
      }
    }

    // ---- BUSINESS LOGIC ----
    const meetingLinkUpdated =
      dto.meetingLink && dto.meetingLink !== booking.meetingLink;

    const movedToCompleted =
      dto.status === BookingStatus.COMPLETED &&
      booking.status !== BookingStatus.COMPLETED;

    if (dto.status) {
      booking.status = dto.status;
    }

    if (dto.meetingLink) {
      booking.meetingLink = dto.meetingLink;
    }

    await booking.save();

    // ---- EMAILS ----
    if (meetingLinkUpdated) {
      const messageText = meetingLinkUpdated
        ? 'Your meeting link has been updated by your consultant on Boardtide.'
        : 'Your consultant has shared a meeting link for your upcoming session through Boardtide.';

      await this.mailService.sendMailTemplate({
        to: booking.customer.email,
        templateName: 'meeting-link.html',
        context: {
          fullName: booking.customer.fullName,
          scheduleDate: booking.scheduleDate,
          slot: `${booking.startTime.slice(0, 5)} - ${booking.endTime.slice(0, 5)}`,
          meetingLink: booking.meetingLink,
          messageText,
          year: new Date().getFullYear(),
        },
        sendAsync: true,
      });
    }

    if (movedToCompleted) {
      await this.mailService.sendMailTemplate({
        to: booking.customer.email,
        templateName: 'booking-complete.html',
        context: {
          fullName: booking.customer.fullName,
          feedbackLink: `${process.env.FRONTEND_URL}/user/my-bookings`,
          year: new Date().getFullYear(),
        },
        sendAsync: true,
      });
    }

    return {
      message: 'Booking updated successfully',
      data: {
        status: booking.status,
        meetingLink: booking.meetingLink,
      },
    };
  }

}
