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
import { BookingTransactionStatus } from "src/common/enums/booking-status.enum";

@Table({ tableName: "bookingtransactions", timestamps: true })
export class BookingTransaction extends Model<BookingTransaction> {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.BIGINT)
    id: number;

    @ForeignKey(() => Booking)
    @Column(DataType.BIGINT)
    bookingId: number;

    @Column({ type: DataType.STRING, allowNull: false, })
    paymentIntentId: string;

    @Column({ type: DataType.STRING, allowNull: true, })
    transactionId?: string;

    @ForeignKey(() => Currency)
    @Column({ type: DataType.BIGINT, allowNull: true, })
    currencyId: number;

    @Column(DataType.INTEGER)
    amount: number;

    @Column({
        type: DataType.ENUM(...Object.values(BookingTransactionStatus)),
        allowNull: false,
        defaultValue: BookingTransactionStatus.PENDING,
    })
    status: BookingTransactionStatus;

    @Column(DataType.JSON)
    rawResponse: any;

    @BelongsTo(() => Booking)
    booking: Booking;

    @BelongsTo(() => Currency)
    currency: Currency;
}
