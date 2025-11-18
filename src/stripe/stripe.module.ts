import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { StripeWebhookController } from './webhook.controller';
import { StripePlatformWebhookController } from './platform-webhook.controller';

@Module({
  imports: [ConfigModule],
  controllers: [StripeController, StripeWebhookController, StripePlatformWebhookController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule { }
