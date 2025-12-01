export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  RESCHEDULED = "RESCHEDULED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYMENT_CANCELLED = "PAYMENT_CANCELLED",
}


export enum BookingTransactionStatus {
  PENDING = "PENDING",
  PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYMENT_CANCELLED = "PAYMENT_CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum EnquiryStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PayoutStatus {
  PENDING = "PENDING",           // after charge.succeeded
  TRANSFER_SENT = "TRANSFER_SENT", // after transfer.created
  FAILED = "FAILED",             // if transfer failed
}
