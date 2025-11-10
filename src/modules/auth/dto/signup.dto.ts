import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';

export enum SignupRole {
    USER = 'USER',
    CONSULTANT = 'CONSULTANT',
}

export class SignupDto {
    @ApiProperty({ example: 'testmail@gmail.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Password@123' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiProperty({ example: '9876543210' })
    @IsOptional()
    phone?: string;

    @ApiProperty({ example: 'CONSULTANT', enum: SignupRole })
    @IsEnum(SignupRole)
    role: SignupRole;

    // 👇 Consultant-specific fields
    @ApiProperty({ example: '123 Main Street' })
    @IsOptional()
    street?: string;

    @ApiProperty({ example: 'Indore' })
    @IsOptional()
    city?: string;

    @ApiProperty({ example: 'Madhya Pradesh' })
    @IsOptional()
    state?: string;

    @ApiProperty({ example: 'Madhya Pradesh' })
    @IsOptional()
    dob?: string;

    @ApiProperty({ example: '452001' })
    @IsOptional()
    zipcode?: string;

    @ApiProperty({ example: 'B.Tech in Computer Science' })
    @IsOptional()
    qualification?: string;

    @ApiProperty({ example: 'Software Development' })
    @IsOptional()
    expertise?: string;

    @ApiProperty({ example: 'John Doe' })
    @IsOptional()
    references?: { name: string; contact: string; designation: string }[];
}
