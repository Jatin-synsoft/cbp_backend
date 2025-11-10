import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from 'src/database/database.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '../mail/mail.module';
import { AffindaModule } from '../affinda/affinda.module';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from 'src/stripe/stripe.service';

@Module({
  imports: [DatabaseModule, MailModule, AffindaModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, StripeService],
  exports: [JwtStrategy],

})
export class AuthModule { }
