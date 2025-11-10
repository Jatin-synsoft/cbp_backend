import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({
    tableName: 'specialtiesMst',
    timestamps: true,
})
export class SpecialtiesMst extends Model {

    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER })
    id: number;

    @Column({ type: DataType.STRING(100), unique: true, allowNull: false })
    name: string;

    @Column({ type: DataType.STRING(255), allowNull: true })
    description: string;
}
