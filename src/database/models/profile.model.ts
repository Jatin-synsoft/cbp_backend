import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { User } from './user.model';
import { Currency } from './currencies.model';
import { StripeAccountStatus } from '../../common/enums/account-status.enum';

@Table({ tableName: 'profiles', timestamps: true, })
export class Profile extends Model {

    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.BIGINT })
    id: number;

    @ForeignKey(() => User)
    @Column({ type: DataType.BIGINT, allowNull: false })
    userId: number;

    @Column({ type: DataType.STRING, allowNull: true })
    timeZone: string;

    @Column({ type: DataType.STRING, allowNull: true })
    street: string;

    @Column({ type: DataType.STRING, allowNull: true })
    city: string;

    @Column({ type: DataType.STRING, allowNull: true })
    state: string;

    @Column({ type: DataType.STRING, allowNull: true })
    zipcode: string;

    @Column({ type: DataType.STRING, allowNull: true })
    country: string;

    @Column({ type: DataType.STRING, allowNull: true })
    dob: string;

    @Column({ type: DataType.STRING, allowNull: true })
    profilePic: string;

    @Column({ type: DataType.STRING, allowNull: true })
    qualification: string;

    @Column({ type: DataType.STRING, allowNull: true })
    expertise: string;

    @Column({ type: DataType.JSON, allowNull: true })
    references: { name: string; contact: string; designation: string }[];

    @Column({ type: DataType.JSON, allowNull: true })
    skills: string[];

    @ForeignKey(() => Currency)
    @Column({ type: DataType.BIGINT, allowNull: true })
    currencyId: number;

    @Column({ type: DataType.DECIMAL, allowNull: true })
    hourlyRate: number;

    @Column({ type: DataType.STRING, unique: true, allowNull: true })
    stripeAccountId: string;

    @Column({ type: DataType.ENUM(...Object.values(StripeAccountStatus)), allowNull: false, defaultValue: StripeAccountStatus.PENDING })
    stripeAccountStatus: StripeAccountStatus;

    @Column({ type: DataType.JSON, allowNull: true })
    stripeProfile: Record<string, any>;

    @BelongsTo(() => User)
    user: User;

    @BelongsTo(() => Currency)
    currency: Currency;
}
