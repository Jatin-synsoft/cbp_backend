import { ApiProperty } from "@nestjs/swagger";
import {
    IsNotEmpty,
    IsString,
    IsEmail,
    IsNumber,
    Min,
} from "class-validator";

/**
 * Create Connected Account DTO
 */
export class CreateConnectedAccountDto {
    @ApiProperty({ example: "consultant@example.com" })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

/**
 * Onboarding Link DTO
 */
export class OnboardingLinkDto {
    @ApiProperty({ example: "acct_1QAbCdEfGh123456" })
    @IsString()
    @IsNotEmpty()
    accountId: string;
}

/**
 * Payout DTO
 */
export class PayoutDto {
    @ApiProperty({ example: "acct_1QAbCdEfGh123456" })
    @IsString()
    @IsNotEmpty()
    accountId: string;

    @ApiProperty({
        example: 5000,
        description: "Amount in smallest currency unit (paise)",
    })
    @IsNumber()
    @Min(1)
    amount: number;
}

/**
 * Create Split PaymentIntent DTO
 */
export class CreatePaymentIntentDto {
    @ApiProperty({
        example: 10000,
        description: "Amount in smallest currency unit",
    })
    @IsNumber()
    @Min(1)
    amount: number;

    @ApiProperty({
        example: "acct_1QAbCdEfGh123456",
        description: "Consultant's connected Stripe account ID",
    })
    @IsString()
    @IsNotEmpty()
    consultantAccountId: string;
}
