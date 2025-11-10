import { DocumentTypes } from 'src/common/enums/document-type.enum';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadResumeDto {
    @ApiProperty({
        example: DocumentTypes.CV,
        description: 'Type of the document being uploaded',
        enum: DocumentTypes,
    })
    @IsEnum(DocumentTypes, { message: 'Invalid document type' })
    @IsNotEmpty({ message: 'Document type is required' })
    documentType: DocumentTypes;
}