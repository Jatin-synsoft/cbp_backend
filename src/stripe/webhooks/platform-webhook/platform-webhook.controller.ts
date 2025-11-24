import { Controller, Post, Req, Res, Headers } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Response, Request } from 'express';
import { PlatformWebhookService } from './platform-webhook.service';

@Controller('stripe/webhook/platform')
export class PlatformWebhookController {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(
    private config: ConfigService,
    private platformWebhookService: PlatformWebhookService,
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'));
    this.webhookSecret = this.config.get('STRIPE_PLATFORM_WEBHOOK_SECRET');
  }

  @Post()
  async handlePlatformWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') sig: string,
  ) {
    let event: Stripe.Event;

    // ------------------------------
    // 1️⃣ VERIFY WEBHOOK SIGNATURE
    // ------------------------------
    try {
      event = this.stripe.webhooks.constructEvent(
        req.body,
        sig,
        this.webhookSecret,
      );
    } catch (e: any) {
      console.log('❌ Webhook Verification Failed!', e.message);
      return res.status(400).send(`Webhook Error: ${e.message}`);
    }

    // ------------------------------
    // 2️⃣ ROUTE EVENT → SERVICE
    // ------------------------------
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.platformWebhookService.handlePaymentIntentSucceeded(event);
          break;

        case 'charge.succeeded':
          await this.platformWebhookService.handleChargeSucceeded(event);
          break;

        case 'transfer.created':
          await this.platformWebhookService.handleTransferCreated(event);
          break;

        case 'payout.paid':
          await this.platformWebhookService.handlePayoutPaid(event);
          break;

        default:
          console.log('⚠️ Unhandled Event:', event.type);
      }
    } catch (err) {
      console.error('❌ Error handling webhook event:', err);
      return res.status(500).json({ success: false, error: err.message });
    }

    return res.send('ok');
  }
}
