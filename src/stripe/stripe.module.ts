import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { PlatformWebhookModule } from './webhooks/platform-webhook/platform-webhook.module';
import { ConnectWebhookModule } from './webhooks/connect-webhook/connect-webhook.module';
import { MailService } from 'src/modules/mail/mail-sendgrid.service';


@Module({
  imports: [ConfigModule, PlatformWebhookModule, ConnectWebhookModule],
  controllers: [StripeController],
  providers: [StripeService, MailService],
  exports: [StripeService],
})
export class StripeModule { }
