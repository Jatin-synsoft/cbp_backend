import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
    ForeignKey,
    BelongsTo,
} from "sequelize-typescript";
import { Booking } from "./booking.model";
import { Currency } from "./currencies.model";
import { User } from "./user.model";
import { PayoutStatus } from "src/common/enums/booking-status.enum";

@Table({ tableName: "consultant_payouts", timestamps: true })
export class ConsultantPayout extends Model<ConsultantPayout> {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.BIGINT)
    id: number;

    @ForeignKey(() => Booking)
    @Column(DataType.BIGINT)
    bookingId: number;

    @ForeignKey(() => User)
    @Column(DataType.BIGINT)
    consultantId: number;

    @Column(DataType.INTEGER)
    amount: number;

    @ForeignKey(() => Currency)
    @Column({ type: DataType.BIGINT, allowNull: false, })
    currencyId: number;

    @Column(DataType.INTEGER)
    platformFee: number;

    @Column(DataType.STRING)
    stripeTransferId: string;

    @Column({
        type: DataType.ENUM(...Object.values(PayoutStatus)),
        allowNull: false,
        defaultValue: PayoutStatus.PENDING,
    })
    status: PayoutStatus;

    @BelongsTo(() => Booking)
    booking: Booking;

    @BelongsTo(() => User)
    consultant: User;

    @BelongsTo(() => Currency)
    currency: Currency;
}
