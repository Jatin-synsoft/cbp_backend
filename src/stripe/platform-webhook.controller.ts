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

@Controller('stripe/webhook/platform')
export class StripePlatformWebhookController {
    private stripe: Stripe;
    private webhookSecret: string;

    constructor(private config: ConfigService) {
        this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'));
        this.webhookSecret = this.config.get('STRIPE_PLATFORM_WEBHOOK_SECRET');
    }

    @Post()
    async handlePlatformWebhook(
        @Req() req: Request,
        @Res() res: Response,
        @Headers('stripe-signature') sig: string,
    ) {
        let event;

        try {
            event = this.stripe.webhooks.constructEvent(
                req['rawBody'],
                sig,
                this.webhookSecret,
            );
        } catch (e) {
            return res.status(400).send(`Webhook Error: ${e.message}`);
        }

        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log('Payment succeeded:', paymentIntent.id);
                await updateBookingPaymentStatus(paymentIntent.id);

                break;
            }

            case 'charge.succeeded':
                console.log('Charge succeeded');
                break;

            default:
                console.log('Unhandled platform event:', event.type);
        }

        res.send('ok');
    }
}

