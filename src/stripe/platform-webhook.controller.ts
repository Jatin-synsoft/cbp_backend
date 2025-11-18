import {
    Controller,
    Post,
    Req,
    Res,
    Headers,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Response } from 'express';
import { updateBookingPaymentStatus, updateStripeProfile } from 'src/common/helper/update-stripe-profile';
import { Request } from 'express';
import { RawBodyRequest } from '@nestjs/common';
@Controller('stripe/webhook/platform')
export class StripePlatformWebhookController {
    private stripe: Stripe;
    private webhookSecret: string;

    constructor(private config: ConfigService) {
        this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'));
        this.webhookSecret = this.config.get('STRIPE_PLATFORM_WEBHOOK_SECRET');

        console.log('===============================');
        console.log('🔥 Stripe Platform Webhook Loaded');
        console.log('🔑 Webhook Secret:', this.webhookSecret);
        console.log('===============================');
    }

    @Post()
    async handlePlatformWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Res() res: Response,
        @Headers('stripe-signature') sig: string,
    ) {
        console.log(`🚀 ~ :34 ~ req:-->`, req.rawBody)
        console.log('\n----------------------------------------');
        console.log('📥 Incoming Stripe Webhook (Platform)');
        console.log('----------------------------------------\n');

        let event;

        try {
            event = this.stripe.webhooks.constructEvent(
                req.rawBody,
                sig,
                this.webhookSecret
            );

            console.log('✅ Webhook Verified Successfully!');
            console.log('📌 Event Type:', event.type);
            console.log('📌 Event ID:', event.id);

        } catch (e: any) {
            console.log('❌ Webhook Verification Failed!');
            console.log('❌ Error:', e.message);
            return res.status(400).send(`Webhook Error: ${e.message}`);
        }

        switch (event.type) {

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;

                console.log('\n💰 PAYMENT INTENT SUCCEEDED');
                console.log('----------------------------------');
                console.log('🆔 PaymentIntent ID:', paymentIntent.id);
                console.log('💵 Amount:', paymentIntent.amount);
                console.log('💱 Currency:', paymentIntent.currency);
                console.log('👤 Consultant Account:', paymentIntent.transfer_data?.destination);
                console.log('🏦 Admin Fee:', paymentIntent.application_fee_amount);
                console.log('----------------------------------\n');

                await updateBookingPaymentStatus(paymentIntent.id);

                break;
            }

            case 'charge.succeeded': {
                console.log('\n💳 CHARGE SUCCEEDED');
                console.log('----------------------------------');
                console.log('Charge ID:', event.data.object.id);
                console.log('Amount:', event.data.object.amount);
                console.log('----------------------------------\n');
                break;
            }

            default:
                console.log('\n⚠️ Unhandled Event:', event.type);
                break;
        }

        res.send('ok');
    }
}
