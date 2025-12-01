import { Profile } from 'src/database/models/profile.model';
import { StripeAccountStatus } from 'src/common/enums/account-status.enum';
import Stripe from 'stripe';

export async function updateStripeProfile(account: Stripe.Account): Promise<void> {
    const isVerified = account.charges_enabled && account.payouts_enabled;
    const external = account.external_accounts?.data?.[0];

    const stripeProfile = {
        id: account.id,
        status: isVerified ? StripeAccountStatus.VERIFIED : StripeAccountStatus.PENDING,
        country: account.country,
        default_currency: account.default_currency,
        business_type: account.business_type,
        business_name: account.business_profile?.name,
        payouts_enabled: account.payouts_enabled,
        charges_enabled: account.charges_enabled,
        bank: external,
        updated_at: new Date().toISOString(),
    };


    await Profile.update(
        {
            stripeAccountStatus: isVerified
                ? StripeAccountStatus.VERIFIED
                : StripeAccountStatus.PENDING,
            stripeProfile,
        },
        { where: { stripeAccountId: account.id } },
    );

    console.log(`✅ stripeProfile updated for ${account.id}`);
}

