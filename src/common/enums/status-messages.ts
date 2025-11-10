import { UserStatus } from '../enums/user-status.enum';

export const STATUS_MESSAGES: Record<UserStatus, string> = {
    [UserStatus.ACTIVE]: 'ACTIVE',
    [UserStatus.PENDING_VERIFICATION]: 'Email not verified. Please check you email for verification link.',
    [UserStatus.INACTIVE]: 'Your account is inactive. Please contact support.',
};
