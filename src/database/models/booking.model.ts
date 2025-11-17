import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { User } from "./user.model";
import { ConsultantSchedule } from "./consultantSchedule.model";
import { BookingStatus } from "src/common/enums/booking-status.enum";

@Table({ tableName: "bookings", timestamps: true, })
export class Booking extends Model<Booking> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    comment: "The user who booked the slot",
  })
  customerId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    comment: "The consultant for this booking",
  })
  consultantId: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    comment: "The date of the booking",
  })
  bookingDate: Date;

  @Column({
    type: DataType.TIME,
    allowNull: false,
    comment: "The start time of the booked slot",
  })
  startTime: string;

  @Column({
    type: DataType.TIME,
    allowNull: false,
    comment: "The end time of the booked slot",
  })
  endTime: string;

  @Column({
    type: DataType.ENUM(...Object.values(BookingStatus)),
    allowNull: false,
    defaultValue: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  amount?: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  scheduleDate?: Date;

  @BelongsTo(() => User, "consultantId")
  consultant: User;

  @BelongsTo(() => User, "customerId")
  customer: User;

}

