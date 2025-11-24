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

    async handlePaymentIntentSucceeded(event: Stripe.Event) {
        type PIWithCharges = Stripe.PaymentIntent & {
            charges: Stripe.ApiList<Stripe.Charge>;
        };

        const paymentIntent = event.data.object as PIWithCharges;

        const transaction = await BookingTransaction.findOne({
            where: { paymentIntentId: paymentIntent.id },
            include: [Booking],
        });

        if (!transaction) {
            this.logger.error(`No transaction found for PaymentIntent: ${paymentIntent.id}`);
            return;
        }

        const booking = await Booking.findByPk(transaction.bookingId, {
            include: ['customer', 'consultant', 'currency'],
        });

        if (!booking) return;

        // Update booking status
        await booking.update({ status: BookingStatus.CONFIRMED });

        // Update transaction
        await transaction.update({
            status: BookingTransactionStatus.PAYMENT_SUCCESS,
            transactionId: paymentIntent.latest_charge?.toString(),
            rawResponse: paymentIntent,
        });

        // Extract charge
        const charge = paymentIntent.charges?.data?.[0];
        if (!charge) return;

        // Stripe direct charge fields
        const platformFee = charge.application_fee_amount ?? 0;
        const consultantAmount = charge.amount - platformFee;

        // ✔️ Transfer ID fix
        const transferId =
            typeof charge.transfer === "string"
                ? charge.transfer
                : charge.transfer?.id ?? null;

        // Create payout entry
        await ConsultantPayout.create({
            bookingId: booking.id,
            consultantId: booking.consultantId,
            amount: consultantAmount,
            currencyId: booking.currencyId,
            platformFee: platformFee ?? 0,
            stripeTransferId: transferId,
            status: "pending"
        });

        // Email to consultant
        await this.mailService.sendMailTemplate({
            to: booking.consultant.email,
            templateName: 'booking-received-consultant.html',
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

    async handleChargeSucceeded(event: Stripe.Event) {
        const charge = event.data.object as Stripe.Charge;
        this.logger.log(`Charge succeeded: ${charge.id}`);
    }

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
