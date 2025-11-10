import { SignupDto } from './signup.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, ValidateNested } from 'class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { DocumentTypes } from 'src/common/enums/document-type.enum';

class DocumentDto {
    @ApiPropertyOptional({ enum: DocumentTypes, description: 'Type of document' })
    @IsOptional()
    document_type: DocumentTypes;

    @ApiPropertyOptional({ description: 'File URL of the document' })
    @IsOptional()
    file_url: string;

    @ApiPropertyOptional({ description: 'ID of the document (for update only)' })
    @IsOptional()
    id?: number;
}

export class UpdateProfileDto extends PartialType(
    OmitType(SignupDto, ['password', 'role'] as const)
) {
    @ApiPropertyOptional({ type: [DocumentDto], description: 'Consultant documents to add/update' })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DocumentDto)
    documents?: DocumentDto[];

    @ApiPropertyOptional({ description: 'File URL of the document' })
    @IsOptional()
    fileUrl: string;

    @ApiPropertyOptional({ type: [Number], description: 'Array of specialty IDs for consultant' })
    @IsOptional()
    @IsArray()
    specialties?: number[];

    @ApiPropertyOptional({ type: [String], description: 'Array of specialty IDs for consultant' })
    @IsOptional()
    @IsArray()
    skills?: string[];

    @ApiPropertyOptional({
        type: [String],
        description: 'Array of education entries as strings (formatted for resume display)',
        example: [
            'Master of Computer Applications (MCA) - DAVV (2024, Grade: 7.43)',
            'B.Sc - Indore University (2021, Grade: A)',
        ],
    })
    @IsOptional()
    @IsArray()
    education?: string[];

    @ApiPropertyOptional({
        type: [String],
        description: 'Array of work experience entries as strings (formatted for resume display)',
        example: [
            'Software Engineer - Synsoft Global (2022–Present)\nIndore, India, Full-time\nDeveloped backend APIs using NestJS and MongoDB',
        ],
    })
    @IsOptional()
    @IsArray()
    workExperience?: string[];

    @ApiPropertyOptional({
        type: [String],
        description: 'Array of project entries as strings (formatted for resume display)',
        example: [
            'Help Desk System (2023–2023)\nDeveloped a ticket management portal using Angular and NestJS',
            'Yoga Retreat App (2024–2024)\nBuilt a booking platform with Next.js and MUI',
        ],
    })
    @IsOptional()
    @IsArray()
    projects?: string[];

    @ApiPropertyOptional({ description: 'Summary of the consultant' })
    @IsOptional()
    summary: string;

    @ApiPropertyOptional({ description: 'Hourly rate for consultant' })
    @IsOptional()
    hourlyRate: number;

    @ApiPropertyOptional({ description: 'Currency for hourly rate' })
    @IsOptional()
    currencyId: number;
}