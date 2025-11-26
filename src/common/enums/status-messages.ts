import { UserStatus } from '../enums/user-status.enum';

export const STATUS_MESSAGES: Record<UserStatus, string> = {
    [UserStatus.ACTIVE]: 'ACTIVE',
    [UserStatus.PENDING_VERIFICATION]: 'Email not verified. Please check your email for the verification link..',
    [UserStatus.INACTIVE]: 'Your account is inactive. Please contact support.',
};
