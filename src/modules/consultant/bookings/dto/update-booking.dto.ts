import { PartialType } from '@nestjs/mapped-types';
import { CreateBookingDto } from './create-booking.dto';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from 'src/common/enums/booking-status.enum';

export class UpdateBookingDto extends PartialType(CreateBookingDto) { }


export class UpdateBookingStatusDto {
  @ApiProperty({ description: 'description', example: BookingStatus.CONFIRMED })
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status: BookingStatus;
}
