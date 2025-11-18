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
                req.body,
                sig,
                this.webhookSecret
            );


        } catch (e: any) {
            console.log('❌ Webhook Verification Failed!');
            console.log('❌ Error:', e.message);
            return res.status(400).send(`Webhook Error: ${e.message}`);
        }

        switch (event.type) {

            case 'payment_intent.succeeded': {
                const pi = event.data.object as Stripe.PaymentIntent;
                await updateBookingPaymentStatus(pi.id, pi);
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

            case 'transfer.created': {
                const transfer = event.data.object as Stripe.Transfer;
                console.log('➡️ Transfer to consultant created:', transfer.amount);
                console.log('Consultant Account:', transfer.destination);
                break;
            }

            case 'payout.paid': {
                const payout = event.data.object as Stripe.Payout;
                console.log('💸 Consultant bank payout:', payout.amount);
                break;
            }

            default:
                console.log('\n⚠️ Unhandled Event:', event.type);
                break;
        }

        res.send('ok');
    }
}
