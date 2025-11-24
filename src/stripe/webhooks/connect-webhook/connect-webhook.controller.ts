import { Controller, Post, Req, Res, Headers } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Request, Response } from 'express';
import { updateStripeProfile } from 'src/common/helper/update-stripe-profile';
import { ConnectWebhookService } from './connect-webhook.service';

@Controller('stripe/webhook')
export class ConnectWebhookController {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(private config: ConfigService,
    private readonly connectWebhookService: ConnectWebhookService,
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'));
    this.webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
  }

  @Post()
  async handleWebhook(@Req() req: Request, @Res() res: Response, @Headers('stripe-signature') sig: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(req.body, sig, this.webhookSecret);
    } catch (e: any) {
      console.log('❌ Webhook Verification Failed!');
      console.log('❌ Error:', e.message);
      return res.status(400).send(`Webhook Error: ${e.message}`);
    }
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        await this.connectWebhookService.updateStripeProfile(account);
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    res.status(200).send('ok');
  }
}
