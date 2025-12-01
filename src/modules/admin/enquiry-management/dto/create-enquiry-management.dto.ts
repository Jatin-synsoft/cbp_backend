import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEnquiryManagementDto {
    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsNotEmpty()
    fullName: string;

    @ApiProperty()
    @IsOptional()
    phone?: string;

    @ApiProperty()
    @IsNotEmpty()
    subject: string;

    @ApiProperty()
    @IsNotEmpty()
    message: string;
}
