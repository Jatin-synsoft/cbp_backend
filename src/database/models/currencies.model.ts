import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, Unique, AllowNull } from 'sequelize-typescript';

@Table({ tableName: 'currencies', timestamps: true })
export class Currency extends Model<Currency> {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.BIGINT)
    id: bigint;

    @Unique
    @AllowNull(false)
    @Column(DataType.STRING(3))
    code: string; // ISO currency code, e.g., USD, INR, EUR

    @AllowNull(false)
    @Column(DataType.STRING(50))
    name: string; // Full currency name, e.g., US Dollar

    @AllowNull(true)
    @Column(DataType.STRING(5))
    symbol: string; // Currency symbol, e.g., $, ₹, €
}
