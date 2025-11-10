export const ConsultantMailConfig = {
    VERIFIED: {
        title: 'Your Verification is Complete 🎉',
        message:
            'Congratulations! Your consultant profile has been successfully verified and is now active for use on the platform.',
        statusColor: '#4CAF50', // Green – success
    },
    UNVERIFIED: {
        title: 'Verification Pending ⏳',
        message:
            'Your consultant profile is currently under review or has been unverified. Please re-upload your documents or contact support for further assistance.',
        statusColor: '#FF9800', // Amber – warning/pending
    },
    ACTIVE: {
        title: 'Account Activated ✅',
        message:
            'Your consultant account has been activated. You can now log in and start accepting bookings.',
        statusColor: '#2196F3', // Blue – active/engaged
    },
    INACTIVE: {
        title: 'Account Deactivated ⚠️',
        message:
            'Your consultant account has been deactivated. Please contact support if you believe this is a mistake.',
        statusColor: '#E53935', // Red – error/critical
    },
};
