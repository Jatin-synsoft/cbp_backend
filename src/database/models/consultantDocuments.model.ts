import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement, Default } from 'sequelize-typescript';
import { User } from './user.model';
import { DocumentTypes } from '../../common/enums/document-type.enum';

@Table({ tableName: 'consultant_documents', timestamps: true, })
export class ConsultantDocument extends Model {

    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.BIGINT })
    id: number;

    @ForeignKey(() => User)
    @Column({ type: DataType.BIGINT, allowNull: false })
    userId: number;

    @Column({ type: DataType.ENUM(...Object.values(DocumentTypes)), allowNull: false })
    documentType: DocumentTypes;

    @Column({ type: DataType.STRING, allowNull: false })
    fileUrl: string;

    @Column({ type: DataType.JSON, allowNull: true })
    parsedData: object;

    @Default(DataType.NOW)
    @Column({ type: DataType.DATE })
    uploadedAt: Date;

    @BelongsTo(() => User)
    user: User;
}
