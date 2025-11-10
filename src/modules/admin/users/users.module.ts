import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from 'src/database/database.module';
import { MailModule } from 'src/modules/mail/mail.module';

@Module({
  imports: [DatabaseModule, MailModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule { }
