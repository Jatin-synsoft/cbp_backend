import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { BookingStatus } from "src/common/enums/booking-status.enum";

export class UpdateBookingDto {
  @ApiProperty({
    example: BookingStatus.CONFIRMED,
    enum: BookingStatus,
    description: "New booking status",
    required: false,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({
    example: "Notes for this booking",
    description: "Booking notes",
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: "Customer cancelled due to emergency",
    description: "Reason for cancellation",
    required: false,
  })
  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @ApiProperty({
    example: "Booking confirmed. Please arrive 15 minutes early.",
    description: "Internal notes for staff",
    required: false,
  })
  @IsOptional()
  @IsString()
  internalNotes?: string;
}