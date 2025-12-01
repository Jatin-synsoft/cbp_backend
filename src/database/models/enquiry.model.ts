import { Table, Column, Model, DataType, AutoIncrement, PrimaryKey } from 'sequelize-typescript';
import { EnquiryStatus } from 'src/common/enums/booking-status.enum';

@Table({ tableName: 'enquiry', timestamps: true, })
export class Enquiry extends Model {

    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.BIGINT })
    id: number;

    @Column({ type: DataType.STRING })
    email: string;

    @Column({ type: DataType.STRING(255), allowNull: false })
    fullName: string;

    @Column({ type: DataType.STRING })
    phone: string;

    @Column({ type: DataType.STRING, allowNull: false, })
    subject: string;

    @Column({ type: DataType.STRING, allowNull: false, })
    message: string;

    @Column({ type: DataType.ENUM(...Object.values(EnquiryStatus)), allowNull: false, defaultValue: EnquiryStatus.PENDING, })
    status: EnquiryStatus;

}

