import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
    AutoIncrement,
    PrimaryKey,
    AllowNull,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Booking } from './booking.model';

@Table({
    tableName: 'consultant_ratings', timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['bookingId', 'userId'],
        },
    ],
})

export class ConsultantRating extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.BIGINT })
    id: number;

    @ForeignKey(() => Booking)
    @AllowNull(false)
    @Column({ type: DataType.BIGINT })
    bookingId: number;

    @ForeignKey(() => User)
    @AllowNull(false)
    @Column({ type: DataType.BIGINT })
    consultantId: number;

    @ForeignKey(() => User)
    @AllowNull(false)
    @Column({ type: DataType.BIGINT })
    userId: number;

    @AllowNull(false)
    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    rating: number;

    @AllowNull(true)
    @Column({ type: DataType.TEXT })
    note: string;

    @BelongsTo(() => Booking)
    booking: Booking;

    @BelongsTo(() => User, { foreignKey: 'consultantId', as: 'consultant' })
    consultant: User;

    @BelongsTo(() => User, { foreignKey: 'userId', as: 'customer' })
    customer: User;

}
