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
@Controller('stripe/webhook/connect')
export class StripeConnectWebhookController {
    private stripe: Stripe;
    private webhookSecret: string;

    constructor(private config: ConfigService) {
        this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'));
        this.webhookSecret = this.config.get('STRIPE_CONNECT_WEBHOOK_SECRET');
    }

    @Post()
    async handleConnectWebhook(
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
            case 'account.updated':
                console.log('Connect account updated');
                break;

            case 'person.updated':
                console.log('Person updated');
                break;

            default:
                console.log('Unhandled connect event:', event.type);
        }

        res.send('ok');
    }
}
