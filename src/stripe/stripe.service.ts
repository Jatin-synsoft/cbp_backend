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

  async createSplitPaymentIntent(consultantAccountId: string, amount: number, currencyCode: string) {

    const consultantStripeAccount = await this.stripe.accounts.retrieve(consultantAccountId);
    if (!consultantStripeAccount) throw new BadRequestException('Consultant not found');

    const adminFee = this.calculateAdminFee(amount);
    const intent = await this.stripe.paymentIntents.create({
      amount: amount,
      currency: currencyCode,
      payment_method_types: ['card'],

      transfer_data: {
        destination: consultantAccountId,
      },

      application_fee_amount: adminFee,
    });
    return { paymentIntentId: intent.id, clientSecret: intent.client_secret };
  }

  calculateAdminFee(amount: number) {
    const percent = this.config.get('ADMIN_FEE');
    return Math.round(amount * (percent / 100));
  }
}
