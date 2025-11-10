import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) { }

  // // 1️⃣ Create connected account
  // @Post('account')
  // @ApiOperation({ summary: 'Create a connected Stripe account for consultant' })
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       email: { type: 'string', example: 'consultant@example.com' },
  //     },
  //     required: ['email'],
  //   },
  // })
  // async createAccount(@Body('email') email: string) {
  //   const account = await this.stripeService.createConnectedAccount(email);
  //   return { accountId: account.id };
  // }

  // 2️⃣ Create onboarding link
  @Post('onboard')
  @ApiOperation({ summary: 'Generate onboarding link for consultant' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', example: 'acct_1QAbCdEfGh123456' },
      },
      required: ['accountId'],
    },
  })
  async onboarding(@Body('accountId') accountId: string) {
    const url = await this.stripeService.createOnboardingLink(accountId);
    return { url };
  }

  @Post('payout')
  @ApiOperation({ summary: 'Send payout to consultant after session completion' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', example: 'acct_1QAbCdEfGh123456' },
        amount: { type: 'number', example: 5000, description: 'Amount in INR (smallest currency unit e.g., paise)' },
      },
      required: ['accountId', 'amount'],
    },
  })
  async payout(
    @Body('accountId') accountId: string,
    @Body('amount') amount: number,
  ) {
    const transfer = await this.stripeService.createTransfer(accountId, amount);
    return { transfer };
  }

  @Get('account/:id')
  @ApiOperation({ summary: 'Get Stripe connected account details/status' })
  @ApiParam({ name: 'id', example: 'acct_1QAbCdEfGh123456', description: 'Stripe connected account ID' })
  async getAccount(@Param('id') id: string) {
    return await this.stripeService.getAccount(id);
  }
}
