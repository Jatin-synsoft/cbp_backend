import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { Booking } from 'src/database/models/booking.model';
import { BookingTransaction } from 'src/database/models/bookingTransaction.model';
import { BookingStatus, BookingTransactionStatus } from 'src/common/enums/booking-status.enum';
import { ConsultantPayout } from 'src/database/models/consultantPayout.model';
import { MailService } from 'src/modules/mail/mail-sendgrid.service';
@Injectable()
export class PlatformWebhookService {

    private readonly logger = new Logger(PlatformWebhookService.name);
    private stripe: Stripe;

    constructor(
        private mailService: MailService, // using DI
    ) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }

    // ====================================================================================
    // 1️⃣ PAYMENT INTENT SUCCEEDED
    // ====================================================================================
    async handlePaymentIntentSucceeded(event: Stripe.Event) {
        const pi = event.data.object as Stripe.PaymentIntent;

        const transaction = await BookingTransaction.findOne({
            where: { paymentIntentId: pi.id },
            include: [Booking],
        });

        if (!transaction) {
            this.logger.error(`No transaction found for PaymentIntent: ${pi.id}`);
            return;
        }

        const booking = await Booking.findByPk(transaction.bookingId, {
            include: ['customer', 'consultant', 'currency'],
        });

        if (!booking) return;

        // Update booking
        await booking.update({ status: BookingStatus.CONFIRMED });

        // Update transaction
        await transaction.update({
            status: BookingTransactionStatus.PAYMENT_SUCCESS,
            transactionId: pi.latest_charge.toString(),
            rawResponse: pi,
        });

        // Email to Consultant
        await this.mailService.sendMailTemplate({
            to: booking.consultant.email,
            templateName: 'new-booking.html',
            context: {
                fullName: booking.consultant.fullName,
                customerName: booking.customer.fullName,
                bookingDate: booking.bookingDate,
                startTime: booking.startTime,
                amount: transaction.amount / 100,
                year: new Date().getFullYear(),
            },
            sendAsync: true,
        });

        this.logger.log(`Payment intent handled for booking: ${booking.id}`);
    }

    // ====================================================================================
    // 2️⃣ CHARGE SUCCEEDED
    // ====================================================================================
    async handleChargeSucceeded(event: Stripe.Event) {
        const charge = event.data.object as Stripe.Charge;
        this.logger.log(`Charge succeeded: ${charge.id}`);
    }

    // ====================================================================================
    // 3️⃣ TRANSFER CREATED → Consultant payout initiated
    // ====================================================================================
    async handleTransferCreated(event: Stripe.Event) {
        const transfer = event.data.object as Stripe.Transfer;

        await ConsultantPayout.create({
            bookingId: +transfer.metadata.bookingId,
            consultantId: +transfer.metadata.consultantId,
            currencyId: +transfer.metadata.currencyId,
            amount: transfer.amount,
            platformFee: +transfer.metadata.platformFee,
            stripeTransferId: transfer.id,
            status: 'TRANSFER_SENT',
        });

        this.logger.log(`Consultant transfer initiated: ${transfer.amount}`);
    }

    // ====================================================================================
    // 4️⃣ PAYOUT PAID → Consultant received money in bank
    // ====================================================================================
    async handlePayoutPaid(event: Stripe.Event) {
        const payout = event.data.object as Stripe.Payout;

        if (!payout.balance_transaction) {
            this.logger.error('No balance transaction found in payout event');
            return;
        }

        // Get balance transaction from stripe
        const bt = await this.stripe.balanceTransactions.retrieve(
            payout.balance_transaction as string,
        );

        const transferId = bt.source;
        if (!transferId) {
            this.logger.error('No transfer id linked to payout');
            return;
        }

        const payoutRecord = await ConsultantPayout.findOne({
            where: { stripeTransferId: transferId.toString() },
        });

        if (!payoutRecord) {
            this.logger.error(`No payout record found for transfer: ${transferId}`);
            return;
        }

        await payoutRecord.update({ status: 'PAID' });

        this.logger.log(`Consultant payout marked as PAID: ${payoutRecord.id}`);
    }
}
