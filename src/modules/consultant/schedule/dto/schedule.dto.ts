
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString, IsNumber, IsOptional } from 'class-validator';

export class ScheduleDto {

    @ApiProperty({
        example: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
        description: 'Recurring rule string (RRULE format)',
    })
    @IsNotEmpty()
    @IsString()
    rrule: string;
}

export class GetAvailabilityDto {
    @ApiPropertyOptional({ example: '2025-11-05', description: 'Start date (ISO format)' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ example: '2025-11-10', description: 'End date (ISO format)' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({
        example: 'Asia/Kolkata',
        description: 'User timezone in IANA format (e.g., Asia/Kolkata, America/New_York)',
    })
    @IsOptional()
    @IsString()
    timezone?: string;
}
