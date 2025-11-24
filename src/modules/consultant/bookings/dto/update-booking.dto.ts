import { PartialType } from '@nestjs/mapped-types';
import { CreateBookingDto } from './create-booking.dto';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from 'src/common/enums/booking-status.enum';

export class UpdateBookingDto extends PartialType(CreateBookingDto) { }


export class UpdateBookingStatusDto {
  @ApiProperty({ description: 'description', example: BookingStatus.CONFIRMED })
  @IsEnum(BookingStatus)
  @IsOptional() s
  status: BookingStatus;

  @ApiProperty({ description: 'meeting link', example: 'https://zoom.us/j/123456789' })
  @IsOptional()
  @IsString()
  meetingLink?: string;
}
