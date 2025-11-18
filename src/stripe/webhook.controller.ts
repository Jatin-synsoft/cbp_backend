import {
    Controller,
    Post,
    Req,
    Res,
    Headers,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Request, Response } from 'express';
import { updateBookingPaymentStatus, updateStripeProfile } from 'src/common/helper/update-stripe-profile';

@Controller('stripe/webhook')
export class StripeWebhookController {
    private stripe: Stripe;
    private webhookSecret: string;

    constructor(private config: ConfigService) {
        this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'));
        this.webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
    }

    @Post()
    async handleWebhook(
        @Req() req: Request,
        @Res() res: Response,
        @Headers('stripe-signature') sig: string,
    ) {
        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(
                req['rawBody'],  // must use rawBody
                sig,
                this.webhookSecret,
            );

        } catch (err: any) {
            console.log('❌ Webhook signature verification failed.');
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await updateBookingPaymentStatus(paymentIntent.id);
                console.log('💰 Payment successful!');
                console.log('PaymentIntent ID:', paymentIntent.id);
                console.log('Amount:', paymentIntent.amount);
                console.log('Currency:', paymentIntent.currency);
                console.log('Consultant Account (Split To):', paymentIntent.transfer_data?.destination);
                console.log('Admin Fee:', paymentIntent.application_fee_amount);

                // TODO: update DB
                // await Orders.update(orderId, { status: 'paid' });
                // await ConsultantEarnings.create(...)
                // await AdminCommission.create(...)

                break;
            }

            /**
             * 🔥 CHARGE SUCCEEDED EVENT (Payment confirmed)
             */
            case 'charge.succeeded': {
                const charge = event.data.object as Stripe.Charge;
                console.log('💳 Charge succeeded:', charge.id);
                break;
            }

            /**
             * 🔥 Money was sent to consultant (ONLY if using manual transfer)
             */
            case 'transfer.created': {
                const transfer = event.data.object as Stripe.Transfer;
                console.log('➡️ Transfer to consultant created:', transfer.amount);
                console.log('Consultant Account:', transfer.destination);
                break;
            }

            /**
             * 🔥 Consultant bank payout (Stripe → Bank Account)
             */
            case 'payout.paid': {
                const payout = event.data.object as Stripe.Payout;
                console.log('💸 Consultant bank payout:', payout.amount);
                break;
            }

            /**
             * 🔁 Account updates (useful for onboarding)
             */
            case 'account.updated': {
                await updateStripeProfile(event.data.object as Stripe.Account);
                break;
            }

            default:
                console.log(`⚠️ Unhandled event type: ${event.type}`);
        }

        res.status(200).send('ok');
    }
}
