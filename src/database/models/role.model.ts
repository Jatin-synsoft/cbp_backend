import { Table, Column, Model, DataType, HasMany, PrimaryKey, AutoIncrement, BelongsToMany } from 'sequelize-typescript';
import { User } from './user.model';
import { UserRoles } from './user-roles.model';
export enum RoleType {
    ADMIN = "admin",
    CONSULTANT = "consultant",
    USER = "user",
}
@Table({
    tableName: 'roles',
    timestamps: true,
})
export class Role extends Model {

    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.BIGINT })
    id: number;


    @Column({
        type: DataType.ENUM(...Object.values(RoleType)),
        allowNull: false,
        unique: true,
    })
    name: RoleType;

    @BelongsToMany(() => User, () => UserRoles)
    users: User[];
}
