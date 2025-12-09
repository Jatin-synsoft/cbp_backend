import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtRolesGuard } from 'src/common/Guards/roles.guard';
import { CreateConnectedAccountDto, OnboardingLinkDto, PayoutDto, CreatePaymentIntentDto, } from "./dto/stripe.dto";

@ApiTags('Stripe')
@ApiBearerAuth()
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) { }

  @Post('onboard')
  async onboarding(@Body() dto: OnboardingLinkDto) {
    const url = await this.stripeService.createOnboardingLink(dto.accountId);
    return { url };
  }

  @Get('login-link/:accountId')
  async getLoginLink(@Param('accountId') accountId: string) {
    return this.stripeService.createLoginLink(accountId);
  }

  // @Get('create-payment-intent/:id')
  // @UseGuards(JwtRolesGuard)
  // @ApiParam({ name: 'id', example: 'acct_1QAbCdEfGh123456' })
  // async createPaymentIntent(@Param('id') id: string, @GetUser() user: any) {
  //   return await this.stripeService.createSplitPaymentIntent(+id, user.id);
  // }


  // @Post('account')
  // async createAccount(@Body() dto: CreateConnectedAccountDto) {
  //   const account = await this.stripeService.createConnectedAccount(dto.email);
  //   return { accountId: account.id };
  // }

  // @Get('account/:id')
  // @ApiParam({ name: 'id', example: 'acct_1QAbCdEfGh123456' })
  // async getAccount(@Param('id') id: string) {
  //   return await this.stripeService.getAccount(id);
  // }


  // @Post('payout')
  // async payout(@Body() dto: PayoutDto) {
  //   const transfer = await this.stripeService.createTransfer(dto.accountId, dto.amount);
  //   return { transfer };
  // }

}
