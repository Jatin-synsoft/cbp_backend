import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from "@nestjs/common";
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { Profile } from './models/profile.model';
import { Role } from './models/role.model';
import { UserRoles } from './models/userRoles.model';
import { SpecialtiesMst } from './models/specialtiesMst.model';
import { ConsultantDocument } from './models/consultantDocuments.model';
import { ConsultantSpecialty } from './models/consultantSpecialties.model';
import { Currency } from './models/currencies.model';
import { ConsultantSchedule } from './models/consultantSchedule.model';
import { Booking } from './models/booking.model';
import { ConsultantPayout } from './models/consultantPayout.model';
import { BookingTransaction } from './models/bookingTransaction.model';
import { ConsultantRating } from './models/consultantRating.model';
import { Enquiry } from './models/enquiry.model';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: "mysql",
        host: configService.get<string>("DATABASE_HOST"),
        port: parseInt(configService.get<string>("DATABASE_PORT")),
        username: configService.get<string>("DATABASE_USERNAME"),
        password: configService.get<string>("DATABASE_PASSWORD") || '',
        database: configService.get<string>("DATABASE_NAME"),
        autoLoadModels: true,
        // synchronize: true,
        // alter: true,
        // define: {
        //   charset: "utf8mb4",
        //   collate: "utf8mb4_unicode_ci",   
        // },
        models: [
          User,
          Profile,
          Role,
          UserRoles,
          SpecialtiesMst,
          ConsultantDocument,
          ConsultantSpecialty,
          Currency,
          ConsultantSchedule,
          Booking,
          BookingTransaction,
          ConsultantPayout,
          ConsultantRating,
          Enquiry
        ],
      }),
    }),
    SequelizeModule.forFeature([
      User,
      Profile,
      Role,
      UserRoles,
      SpecialtiesMst,
      ConsultantDocument,
      ConsultantSpecialty,
      Currency,
      ConsultantSchedule,
      Booking,
      BookingTransaction,
      ConsultantPayout,
      ConsultantRating,
      Enquiry
    ]),
  ],
  exports: [SequelizeModule], // Export so other modules can use @InjectModel
})
export class DatabaseModule { }
