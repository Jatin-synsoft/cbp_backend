import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { AffindaModule } from './modules/affinda/affinda.module';
import { UploadModule } from './modules/upload/upload.module';
import { AdminModule } from './modules/admin/admin.module';
import { PublicModule } from './modules/public/public.module';
import { ConsultantModule } from './modules/consultant/consultant.module';
import { BookingModule } from './modules/slot-booking/booking/booking.module';
import { StripeModule } from './stripe/stripe.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    DatabaseModule,
    AuthModule,
    MailModule,
    AdminModule,
    AffindaModule,
    UploadModule,
    PublicModule,
    ConsultantModule,
    BookingModule,
    StripeModule,
    UserModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
