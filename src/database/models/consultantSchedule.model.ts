import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
    PrimaryKey,
    AutoIncrement,
} from 'sequelize-typescript';
import { User } from './user.model';

@Table({ tableName: 'consultantSchedule', timestamps: true, })
export class ConsultantSchedule extends Model<ConsultantSchedule> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.BIGINT })
    id: number;

    @ForeignKey(() => User)
    @Column({ type: DataType.BIGINT, allowNull: false })
    userId: number;

    @BelongsTo(() => User)
    consultant: User;

    @Column({ type: DataType.TEXT, allowNull: false })
    rrule: string;

}
