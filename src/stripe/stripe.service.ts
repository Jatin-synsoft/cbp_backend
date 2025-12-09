import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private config: ConfigService,) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'));
  }

  async createConnectedAccount(email: string) {
    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        email,
      });
      return account;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async createOnboardingLink(accountId: string) {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.FRONTEND_URL}/consultant/stripe-fail`,
        return_url: `${process.env.FRONTEND_URL}/consultant/stripe-success`,
        type: 'account_onboarding',
      });
      return accountLink.url;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async createLoginLink(accountId: string) {
    const loginLink = await this.stripe.accounts.createLoginLink(accountId);
    return { data: loginLink.url };

  }


  async createTransfer(accountId: string, amount: number, currency = 'usd') {
    try {
      const transfer = await this.stripe.transfers.create({
        amount,
        currency,
        destination: accountId,
      });
      return transfer;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async getAccount(accountId: string) {
    try {
      return await this.stripe.accounts.retrieve(accountId);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  toTwoDecimalsNoRound(value: number): number {
    return Math.trunc(value * 100) / 100;
  }

  calculateAdminFee(amount: number): number {
    const percent = Number(this.config.get('ADMIN_FEE')) || 0;
    const fee = amount * percent / 100;
    return this.toTwoDecimalsNoRound(fee);  // 2 decimals, no rounding
  }

  async createSplitPaymentIntent(
    consultantAccountId: string,
    amountInMajor: number,
    platformFee: number,
    currencyCode: string
  ) {
    // const adminFeeMajor = this.calculateAdminFee(amountInMajor);

    const amount = amountInMajor * 100;
    const adminFee = platformFee * 100;

    const intent = await this.stripe.paymentIntents.create({
      amount,
      currency: currencyCode,
      automatic_payment_methods: { enabled: true },
      application_fee_amount: adminFee,
      transfer_data: { destination: consultantAccountId }
    });

    return {
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
    };
  }

}
