import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasOne, AutoIncrement, PrimaryKey, BelongsToMany, HasMany } from 'sequelize-typescript';
import { Role } from './role.model';
import { Profile } from './profile.model';
import { UserRoles } from './user-roles.model';
import { ConsultantDocument } from './consultant-documents.model';
import { ConsultantSpecialty } from './consultant_specialties.model';
import { UserStatus } from '../../common/enums/user-status.enum';

@Table({
    tableName: 'users',
    timestamps: true,
})
export class User extends Model {

    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.BIGINT })
    id: number;

    @Column({ type: DataType.STRING, unique: true })
    email: string;

    @Column({ type: DataType.STRING })
    password: string;

    @Column({ type: DataType.STRING(255), allowNull: false })
    fullName: string;

    @Column({ type: DataType.STRING })
    phone: string;;

    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    isVerified: boolean;

    @Column({ type: DataType.ENUM(...Object.values(UserStatus)), allowNull: false, defaultValue: UserStatus.PENDING_VERIFICATION, })
    status: UserStatus;

    @BelongsToMany(() => Role, () => UserRoles)
    roles: Role[];

    @HasOne(() => Profile)
    profile: Profile;

    @HasMany(() => ConsultantDocument)
    consultantDocuments: ConsultantDocument[];

    @HasMany(() => ConsultantSpecialty)
    consultantSpecialties: ConsultantSpecialty[];

}

