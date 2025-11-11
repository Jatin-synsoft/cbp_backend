import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private config: ConfigService) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'));
  }

  // 🧩 1. Create Express Connected Account
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

  // 🔗 2. Generate Onboarding Link
  async createOnboardingLink(accountId: string) {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: 'http://192.168.0.191:3000/auth/stripe-fail',
        return_url: 'http://192.168.0.191:3000/auth/stripe-success',
        type: 'account_onboarding',
      });
      return accountLink.url;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  // 💸 3. Transfer to Consultant (after completed session)
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

  // 🧾 4. Retrieve Account Status
  async getAccount(accountId: string) {
    try {
      return await this.stripe.accounts.retrieve(accountId);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}
