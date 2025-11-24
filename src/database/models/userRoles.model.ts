import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    CreatedAt,
    UpdatedAt,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";
import { User } from "./user.model";
import { Role } from "./role.model";

@Table({ tableName: "user_roles", timestamps: true, })

export class UserRoles extends Model<UserRoles> {

    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.BIGINT })
    id: bigint;

    @ForeignKey(() => User)
    @Column({ type: DataType.BIGINT, allowNull: false, })
    userId: number;

    @ForeignKey(() => Role)
    @Column({ type: DataType.BIGINT, allowNull: false, })
    roleId: number;
}
