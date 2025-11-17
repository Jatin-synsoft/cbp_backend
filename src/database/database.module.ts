import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from "@nestjs/common";
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { Profile } from './models/profile.model';
import { Role } from './models/role.model';
import { UserRoles } from './models/user-roles.model';
import { SpecialtiesMst } from './models/specialtiesMst.model';
import { ConsultantDocument } from './models/consultant-documents.model';
import { ConsultantSpecialty } from './models/consultant_specialties.model';
import { Currency } from './models/currencies.model';
import { ConsultantSchedule } from './models/consultantSchedule.model';
import { Booking } from './models/booking.model';
import { ConsultantPayout } from './models/consultantPayout.model';
import { BookingTransaction } from './models/bookingTransaction.model';

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
        autoLoadModels: true, // Automatically registers models
        // synchronize: true,
        // alter: true, // safer
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
          ConsultantPayout
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
      ConsultantPayout
    ]),
  ],
  exports: [SequelizeModule], // Export so other modules can use @InjectModel
})
export class DatabaseModule { }
