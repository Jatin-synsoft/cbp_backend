import { Profile } from 'src/database/models/profile.model';
import { StripeAccountStatus } from 'src/common/enums/account-status.enum';
import Stripe from 'stripe';
import { Booking } from 'src/database/models/booking.model';
import { BookingStatus, BookingTransactionStatus } from '../enums/booking-status.enum';
import { BookingTransaction } from 'src/database/models/bookingTransaction.model';
import { NotFoundException } from '@nestjs/common';
import { ConsultantPayout } from 'src/database/models/consultantPayout.model';

export async function updateStripeProfile(account: Stripe.Account): Promise<void> {
    const isVerified = account.charges_enabled && account.payouts_enabled;
    const external = account.external_accounts?.data?.[0];

    const stripeProfile = {
        id: account.id,
        status: isVerified ? StripeAccountStatus.VERIFIED : StripeAccountStatus.PENDING,
        country: account.country,
        default_currency: account.default_currency,
        business_type: account.business_type,
        business_name: account.business_profile?.name,
        payouts_enabled: account.payouts_enabled,
        charges_enabled: account.charges_enabled,
        bank: external,
        updated_at: new Date().toISOString(),
    };


    await Profile.update(
        {
            stripeAccountStatus: isVerified
                ? StripeAccountStatus.VERIFIED
                : StripeAccountStatus.PENDING,
            stripeProfile,
        },
        { where: { stripeAccountId: account.id } },
    );

    console.log(`✅ stripeProfile updated for ${account.id}`);
}

export async function updateBookingPaymentStatus(
    paymentIntentId: string,
    paymentIntent?: any
): Promise<void> {

    // 1️⃣ Find the transaction
    const txn = await BookingTransaction.findOne({
        where: { paymentIntentId },
    });

    if (!txn) throw new NotFoundException("Transaction not found");

    // 2️⃣ Find booking
    const booking = await Booking.findByPk(txn.bookingId);

    if (!booking) throw new NotFoundException("Booking not found");

    // 3️⃣ Update transaction & booking status
    await BookingTransaction.update(
        { status: BookingTransactionStatus.PAYMENT_SUCCESS },
        { where: { id: txn.id } }
    );

    await Booking.update(
        { status: BookingStatus.CONFIRMED },
        { where: { id: booking.id } }
    );

    // 4️⃣ If PaymentIntent is provided → create payout entry
    if (!paymentIntent) return;

    const charge = paymentIntent.charges?.data?.[0];
    if (!charge) return;

    // Stripe direct charge fields
    const transferId = charge.transfer_id;
    const platformFee = charge.application_fee_amount;
    const consultantAmount =
        charge.amount - (platformFee || 0);

    // 5️⃣ Create payout record
    await ConsultantPayout.create({
        bookingId: booking.id,
        consultantId: booking.consultantId,
        amount: consultantAmount,
        currencyId: booking.currencyId,
        platformFee: platformFee ?? 0,
        stripeTransferId: transferId,
        status: "pending"
    });

    console.log("Consultant payout saved:", transferId);
}
