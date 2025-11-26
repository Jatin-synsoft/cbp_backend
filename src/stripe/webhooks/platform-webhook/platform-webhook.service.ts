import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { Booking } from 'src/database/models/booking.model';
import { BookingTransaction } from 'src/database/models/bookingTransaction.model';
import { BookingStatus, BookingTransactionStatus } from 'src/common/enums/booking-status.enum';
import { ConsultantPayout } from 'src/database/models/consultantPayout.model';
import { MailService } from 'src/modules/mail/mail-sendgrid.service';
import { Currency } from 'src/database/models/currencies.model';
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
        console.log(`🚀 ~ :44 ~ booking:-->`, booking)

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
            templateName: 'booking-received-consultant.html',
            context: {
                consultantName: booking.consultant.fullName,
                userFullName: booking.customer.fullName,
                scheduleDate: booking.scheduleDate,
                time: `${booking.startTime.slice(0, 5)} - ${booking.endTime.slice(0, 5)}`,
                receivedAmount: `${booking.currency.symbol} ${booking.consultantPayout?.amount ?? 0}`,
                platformFee: `${booking.currency.symbol} ${booking.consultantPayout?.platformFee ?? 0}`,
                totalAmount: `${booking.currency.symbol} ${transaction.amount}`,
                year: new Date().getFullYear(),
            },
            sendAsync: true,
        });

        this.logger.log(`Payment intent handled for booking: ${booking.id}`);
    }

    async handleChargeSucceeded(event: Stripe.Event) {
        const charge = event.data.object as Stripe.Charge;
        console.log("\n================= 🔵 CHARGE.SUCCEEDED RECEIVED =================");
        console.log("Raw charge object =>", charge);

        if (!charge) return;

        // 1️⃣ Normalize PaymentIntent ID
        const paymentIntentId =
            typeof charge.payment_intent === "string"
                ? charge.payment_intent
                : charge.payment_intent?.id;

        console.log("Extracted PaymentIntent ID =>", paymentIntentId);

        if (!paymentIntentId) {
            console.error("❌ ERROR: No valid PaymentIntent ID found in charge event");
            return;
        }

        // 2️⃣ Fees & payout calculations
        const platformFee = charge.application_fee_amount ?? 0;
        const consultantAmount = charge.amount - platformFee;

        console.log("Charge Amount =>", charge.amount);
        console.log("Platform Fee =>", platformFee);
        console.log("Consultant Amount =>", consultantAmount);

        // 3️⃣ Find related transaction
        const transaction = await BookingTransaction.findOne({
            where: { paymentIntentId },
            include: [Booking],
        });

        console.log("Fetched BookingTransaction =>", transaction);

        if (!transaction) {
            console.error(`❌ ERROR: No transaction found for PaymentIntent: ${paymentIntentId}`);
            return;
        }

        const booking = transaction.booking;
        console.log("Related Booking =>", booking);

        // 4️⃣ Create Consultant Payout Entry
        const payout = await ConsultantPayout.create({
            bookingId: booking.id,
            consultantId: booking.consultantId,
            amount: consultantAmount / 100,
            currencyId: booking.currencyId,
            platformFee: platformFee / 100,
            stripeTransferId: charge.id,
            status: "PENDING",
        });

        console.log("🟢 Consultant Payout Created =>", payout.dataValues);
        console.log("================================================================\n");

        this.logger.log(`Charge succeeded: ${charge.id}`);
    }



    async handleTransferCreated(event: Stripe.Event) {
        const transfer = event.data.object as Stripe.Transfer;
        console.log("\n================= 🔵 TRANSFER.CREATED RECEIVED =================");
        console.log("Raw Transfer object =>", transfer);

        const updated = await ConsultantPayout.update(
            {
                status: "TRANSFER_SENT",
            },
            {
                where: { stripeTransferId: transfer.id },
            }
        );

        console.log("Update result =>", updated);
        console.log(`🟢 Consultant payout marked as TRANSFER_SENT for transferId: ${transfer.id}`);
        console.log("================================================================\n");

        this.logger.log(`Consultant transfer initiated: ${transfer.amount}`);
    }



    async handlePayoutPaid(event: Stripe.Event) {
        const payout = event.data.object as Stripe.Payout;
        console.log("\n================= 🔵 PAYOUT.PAID RECEIVED =================");
        console.log("Raw Payout object =>", payout);

        if (!payout.balance_transaction) {
            console.error("❌ ERROR: payout.balance_transaction missing");
            return;
        }

        // 1️⃣ Fetch balance transaction to get transfer source
        const bt = await this.stripe.balanceTransactions.retrieve(
            payout.balance_transaction as string,
        );

        console.log("Balance Transaction =>", bt);

        const transferId = bt.source;

        if (!transferId) {
            console.error("❌ ERROR: No transfer ID found in balance transaction");
            return;
        }

        console.log("Resolved Transfer ID =>", transferId);

        // 2️⃣ Find payout record
        const payoutRecord = await ConsultantPayout.findOne({
            where: { stripeTransferId: transferId.toString() },
        });

        console.log("Fetched ConsultantPayout Record =>", payoutRecord);

        if (!payoutRecord) {
            console.error(`❌ ERROR: No payout record found for transfer: ${transferId}`);
            return;
        }

        // 3️⃣ Update to PAID
        await payoutRecord.update({ status: "PAID" });

        console.log(`🟢 Consultant payout updated to PAID (ID: ${payoutRecord.id})`);
        console.log("================================================================\n");

        this.logger.log(`Consultant payout marked as PAID: ${payoutRecord.id}`);
    }

}
