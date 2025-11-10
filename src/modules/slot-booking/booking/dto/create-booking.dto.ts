import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsDecimal,
  Length,
  Min,
  Max,
  IsISO8601,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
  IsArray,
} from "class-validator";
import { Transform } from "class-transformer";
import { BookingStatus } from "src/common/enums/booking-status.enum";

export class CreateBookingDto {
  @ApiProperty({ description: "Provider ID" })
  @IsInt()
  @Min(1)
  consultantId: number;

  @ApiProperty({ description: "Booking date", example: "2024-01-15" })
  @IsDateString()
  bookingDate: string;

  @ApiProperty({ description: "Booking date", example: "2024-01-15" })
  @IsDateString()
  scheduleDate: string;

  @ApiProperty({ description: "Start time", example: "09:00" })
  @IsString()
  startTime: string;

  @ApiProperty({ description: "End time", example: "10:00" })
  @IsString()
  endTime: string;

  @ApiProperty({ description: "Booking notes (optional)", required: false })
  @IsOptional()
  notes?: string;

}

export class ConfirmBookingDto {
  @ApiProperty({ description: "Payment reference", required: false })
  @IsOptional()
  @IsString()
  paymentReference?: string;
}



export class BookingQueryDto {
  @ApiProperty({
    example: BookingStatus.CONFIRMED,
    enum: BookingStatus,
    description: "Filter by booking status",
    required: false,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({
    example: "2024-01-01",
    description: "Filter bookings from this date (YYYY-MM-DD)",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    example: "2024-12-31",
    description: "Filter bookings until this date (YYYY-MM-DD)",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    example: 1,
    description: "Filter by provider ID",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  providerId?: bigint;

  @ApiProperty({
    example: 1,
    description: "Filter by service ID",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  serviceId?: bigint;

  @ApiProperty({
    example: 1,
    description: "Page number for pagination",
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    example: 10,
    description: "Number of items per page",
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class BookingResponseDto {
  @ApiProperty()
  bookingId: bigint;

  @ApiProperty()
  clientUserId: bigint;

  @ApiProperty()
  providerId: bigint;

  @ApiProperty()
  serviceId: bigint;

  @ApiProperty({ required: false })
  timeSlotId?: bigint;

  @ApiProperty()
  bookingDate: Date;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty({ enum: BookingStatus })
  status: BookingStatus;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Related entities
  @ApiProperty({ required: false })
  client?: {
    userId: bigint;
    fullName: string;
    email: string;
  };

  @ApiProperty({ required: false })
  provider?: {
    providerId: bigint;
    userId: bigint;
    bio?: string;
    contactPhone?: string;
    contactEmail?: string;
    user?: {
      userId: bigint;
      fullName: string;
      email: string;
    };
  };

  @ApiProperty({ required: false })
  service?: {
    serviceId: bigint;
    name: string;
    description?: string;
    durationMinutes: number;
    price?: number;
  };
}

export class RescheduleBookingDto {
  @ApiProperty({ description: "New booking date", example: "2024-01-16" })
  @IsDateString()
  newBookingDate: string;

  @ApiProperty({ description: "New start time", example: "10:00" })
  @IsString()
  newStartTime: string;

  @ApiProperty({ description: "New end time", example: "11:00" })
  @IsString()
  newEndTime: string;

  @ApiProperty({ description: "Reason for rescheduling", required: false })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}

export class BookingSearchDto {
  @ApiProperty({ description: "Client user ID", required: false })
  @IsOptional()
  clientUserId?: bigint;

  @ApiProperty({ description: "Service ID", required: false })
  @IsOptional()
  serviceId?: bigint;

  @ApiProperty({ description: "Booking status", required: false })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({ description: "Start date for search range", required: false })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiProperty({ description: "End date for search range", required: false })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiProperty({ description: "Start time for search range", required: false })
  @IsOptional()
  startTime?: string;

  @ApiProperty({ description: "Page number", required: false, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ description: "Items per page", required: false, default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AvailableSlotDto {
  @ApiProperty({ description: "Provider ID" })
  @IsNotEmpty()
  providerId: bigint;

  @ApiProperty({ description: "Service ID" })
  @IsNotEmpty()
  serviceId: bigint;

  @ApiProperty({ description: "Start date", example: "2024-01-15" })
  @IsISO8601()
  startDate: string;

  @ApiProperty({ description: "End date", example: "2024-01-16" })
  @IsISO8601()
  endDate: string;

  @ApiProperty({
    description: "Slot duration in minutes",
    required: false,
    default: 30,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(480)
  slotDurationMinutes?: number;
}

export class BookingStatsDto {
  @ApiProperty({ description: "Start date for stats", required: false })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiProperty({ description: "End date for stats", required: false })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiProperty({ description: "Provider ID", required: false })
  @IsOptional()
  providerId?: bigint;

  @ApiProperty({ description: "Service ID", required: false })
  @IsOptional()
  serviceId?: bigint;
}

export class CancelBookingDto {
  @ApiProperty({
    example: "Personal emergency",
    description: "Reason for cancellation",
  })
  @IsString()
  @Length(1, 500)
  reason: string;

  @ApiProperty({ description: "Refund amount (optional)", required: false })
  @IsOptional()
  @IsDecimal({ decimal_digits: "2" })
  refundAmount?: number;
}

export class BookingAnalyticsDto {
  @ApiProperty({ example: 150, description: "Total number of bookings" })
  totalBookings: number;

  @ApiProperty({ example: 120, description: "Number of confirmed bookings" })
  confirmedBookings: number;

  @ApiProperty({ example: 15, description: "Number of cancelled bookings" })
  cancelledBookings: number;

  @ApiProperty({ example: 2500.0, description: "Total revenue" })
  totalRevenue: number;

  @ApiProperty({ example: 16.67, description: "Average booking value" })
  averageBookingValue: number;

  @ApiProperty({
    example: [
      { date: "2024-01-01", count: 5 },
      { date: "2024-01-02", count: 8 },
    ],
    description: "Daily booking counts",
  })
  dailyBookings: Array<{ date: string; count: number }>;
}

export class BookedSlotDto {
  @ApiProperty({ description: "Provider ID" })
  @IsNotEmpty()
  providerId: bigint;

  @ApiProperty({
    description: "Start date",
    example: "2024-01-15",
    required: true,
  })
  @IsISO8601()
  startDate: string;

  @ApiProperty({
    description: "End date",
    example: "2024-01-16",
    required: true,
  })
  @IsISO8601()
  endDate: string;

  @ApiProperty({
    description: "Slot Time",
  })
  @IsString()
  @IsOptional()
  startTime?: string;
}
