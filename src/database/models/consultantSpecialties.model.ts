import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
    ForeignKey,
    BelongsTo,
} from 'sequelize-typescript';
import { SpecialtiesMst } from './specialtiesMst.model';
import { User } from './user.model';

@Table({
    tableName: 'consultant_specialties',
    timestamps: true,
})
export class ConsultantSpecialty extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.BIGINT })
    id: bigint;

    @ForeignKey(() => User)
    @Column({ type: DataType.BIGINT, allowNull: false })
    userId: number;

    @ForeignKey(() => SpecialtiesMst)
    @Column({ type: DataType.INTEGER, allowNull: false })
    specialtyId: number;

    @BelongsTo(() => User, { onDelete: 'CASCADE' })
    user: User;

    @BelongsTo(() => SpecialtiesMst, { onDelete: 'CASCADE' })
    specialty: SpecialtiesMst;
}
