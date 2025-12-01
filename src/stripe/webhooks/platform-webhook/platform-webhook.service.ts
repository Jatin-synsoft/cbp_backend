import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { Booking } from 'src/database/models/booking.model';
import { BookingTransaction } from 'src/database/models/bookingTransaction.model';
import { BookingStatus, BookingTransactionStatus, PayoutStatus } from 'src/common/enums/booking-status.enum';
import { ConsultantPayout } from 'src/database/models/consultantPayout.model';
import { MailService } from 'src/modules/mail/mail-sendgrid.service';
import { Currency } from 'src/database/models/currencies.model';
@Injectable()
export class PlatformWebhookService {

    private readonly logger = new Logger(PlatformWebhookService.name);
    private stripe: Stripe;

    constructor(private mailService: MailService,) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }

    async handlePaymentIntentSucceeded(event: Stripe.Event) {
        const pi = event.data.object as Stripe.PaymentIntent;

        const transaction = await BookingTransaction.findOne({
            where: { paymentIntentId: pi.id },
            include: [{
                model: Booking,
                include: ['customer', 'consultant', 'currency', 'consultantPayout'],
            },
            {
                model: Currency,
                attributes: ['code', 'symbol'],
            }],
        });

        if (!transaction) {
            this.logger.error(`No transaction found for PaymentIntent: ${pi.id}`);
            return;
        }

        const booking = await Booking.findByPk(transaction.bookingId, {
            include: ['customer', 'consultant', 'currency', 'consultantPayout'],
        });

        if (!booking) return;

        await booking.update({ status: BookingStatus.CONFIRMED });

        await transaction.update({
            status: BookingTransactionStatus.PAYMENT_SUCCESS,
            transactionId: pi.latest_charge.toString(),
            rawResponse: pi,
        });

        await this.mailService.sendMailTemplate({
            to: booking.consultant.email,
            templateName: 'booking-received-consultant.html',
            context: {
                consultantName: booking.consultant.fullName,
                userFullName: booking.customer.fullName,
                scheduleDate: booking.scheduleDate,
                time: `${booking.startTime.slice(0, 5)} - ${booking.endTime.slice(0, 5)}`,
                year: new Date().getFullYear(),
            },
            sendAsync: true,
        });

        this.logger.log(`Payment intent handled for booking: ${booking.id}`);
    }

    async handleChargeSucceeded(event: Stripe.Event) {
        const charge = event.data.object as Stripe.Charge;

        if (!charge) return;

        // 1️⃣ Normalize PaymentIntent ID
        const paymentIntentId =
            typeof charge.payment_intent === "string"
                ? charge.payment_intent
                : charge.payment_intent?.id;


        if (!paymentIntentId) {
            console.error("❌ ERROR: No valid PaymentIntent ID found in charge event");
            return;
        }

        const platformFee = charge.application_fee_amount ?? 0;
        const consultantAmount = charge.amount - platformFee;

        const transaction = await BookingTransaction.findOne({
            where: { paymentIntentId },
            include: [Booking],
        });


        if (!transaction) {
            console.error(`❌ ERROR: No transaction found for PaymentIntent: ${paymentIntentId}`);
            return;
        }

        const booking = transaction.booking;

        await ConsultantPayout.create({
            bookingId: booking.id,
            consultantId: booking.consultantId,
            amount: consultantAmount / 100,
            currencyId: booking.currencyId,
            platformFee: platformFee / 100,
            stripeTransferId: charge.id,
            status: PayoutStatus.PENDING,
        });

        this.logger.log(`Charge succeeded: ${charge.id}`);
    }

    async handleTransferCreated(event: Stripe.Event) {
        const transfer = event.data.object as Stripe.Transfer;

        const chargeId =
            typeof transfer.source_transaction === "string"
                ? transfer.source_transaction
                : transfer.source_transaction?.id;


        const payout = await ConsultantPayout.findOne({
            where: { stripeTransferId: chargeId },
            include: [
                {
                    model: Booking,
                    include: ['consultant', 'customer', 'currency'],
                },
            ],
        });

        if (!payout) {
            console.error(`❌ No ConsultantPayout found for transferId: ${transfer.id}`);
            return;
        }

        const booking = payout.booking;

        if (!booking) {
            console.error(`❌ No booking linked to payoutId ${payout.id}`);
            return;
        }

        await ConsultantPayout.update(
            { status: PayoutStatus.TRANSFER_SENT },
            { where: { stripeTransferId: chargeId } }
        );


        const totalAmount = payout.amount + payout.platformFee;
        const platformFee = payout.platformFee;
        const consultantReceives = payout.amount;
        const currencySymbol = booking.currency?.symbol || "$";

        await this.mailService.sendMailTemplate({
            to: booking.consultant.email,
            templateName: "consultant-payout.html",
            context: {
                consultantName: booking.consultant.fullName,
                userFullName: booking.customer.fullName,
                scheduleDate: booking.scheduleDate,
                time: `${booking.startTime.slice(0, 5)} - ${booking.endTime.slice(0, 5)}`,
                totalAmount,
                platformFee,
                consultantReceives,
                currencySymbol,
                year: new Date().getFullYear(),
            },
            sendAsync: true,
        });

        this.logger.log(`Consultant transfer initiated: ${transfer.amount}`);
    }

    async handlePaymentFailed(event: any) {
        const intent = event.data.object as Stripe.PaymentIntent;

        const tx = await BookingTransaction.findOne({
            where: { paymentIntentId: intent.id },
        });
        if (!tx) return;

        tx.status = BookingTransactionStatus.PAYMENT_FAILED;
        await tx.save();

        await Booking.update(
            { status: BookingStatus.PAYMENT_FAILED },
            { where: { id: tx.bookingId } }
        );
    }

    async handlePaymentCanceled(event: Stripe.Event) {
        const intent = event.data.object as Stripe.PaymentIntent;

        const tx = await BookingTransaction.findOne({
            where: { paymentIntentId: intent.id },
        });
        if (!tx) return;

        await tx.update({ status: BookingTransactionStatus.PAYMENT_CANCELLED });

        await Booking.update(
            { status: BookingStatus.PAYMENT_CANCELLED },
            { where: { id: tx.bookingId } }
        );

        this.logger.log(`Payment cancelled for PI:${intent.id}`);
    }
}
