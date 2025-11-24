import { Module } from '@nestjs/common';
import { ConnectWebhookService } from './connect-webhook.service';
import { ConnectWebhookController } from './connect-webhook.controller';
import { MailService } from 'src/modules/mail/mail-sendgrid.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ConnectWebhookController],
  providers: [ConnectWebhookService, MailService],
})
export class ConnectWebhookModule { }
