import { Module } from '@nestjs/common';
import { PlatformWebhookService } from './platform-webhook.service';
import { PlatformWebhookController } from './platform-webhook.controller';
import { MailService } from 'src/modules/mail/mail-sendgrid.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PlatformWebhookController],
  providers: [PlatformWebhookService, MailService],
})
export class PlatformWebhookModule { }
