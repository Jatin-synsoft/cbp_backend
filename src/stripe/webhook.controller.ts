import { Controller, Post, Req, Res, Headers } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Request, Response } from 'express';
import { Profile } from 'src/database/models/profile.model';

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
                req.body,
                sig,
                this.webhookSecret,
            );
        } catch (err) {
            console.log('⚠️ Webhook signature verification failed.');
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        switch (event.type) {
            case 'account.updated':
                const account = event.data.object as Stripe.Account;
                console.log(`Account ${account.id} updated`);
                if (account.charges_enabled && account.payouts_enabled) {
                    await Profile.update(
                        { stripeAccountStatus: 'VERIFIED' },
                        { where: { stripeAccountId: account.id } },
                    );
                } else {
                    console.log('⏳ Consultant not fully verified yet.');
                    await Profile.update(
                        { stripeAccountStatus: 'PENDING' },
                        { where: { stripeAccountId: account.id } },
                    );
                } break;
            case 'transfer.created':
                console.log('✅ Transfer created');
                break;
            case 'payout.paid':
                console.log('💸 Consultant payout successful');
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.status(200).send('ok');
    }
}
