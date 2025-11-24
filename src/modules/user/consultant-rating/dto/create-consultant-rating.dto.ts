import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min, Max, IsOptional, IsArray, IsString } from 'class-validator';

export class CreateRatingDto {
    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    bookingId: number;

    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    consultantId: number;

    @ApiProperty()
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    note?: string;
}
