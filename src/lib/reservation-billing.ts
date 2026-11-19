type StayBillingInput = {
  checkIn: Date;
  checkOut: Date;
  totalAmount: number;
  status: string;
  pricePerNight: number;
  amountPaid: number;
};

export type StayBilling = {
  reservedNights: number;
  chargedNights: number;
  extraNights: number;
  currentTotal: number;
  amountPaid: number;
  balance: number;
};

function utcDayValue(date: Date) {
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
}

function nightsBetween(start: Date, end: Date) {
  return Math.round((utcDayValue(end) - utcDayValue(start)) / 86400000);
}

function roundMoney(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function calculateStayBilling(
  input: StayBillingInput,
  asOf: Date = new Date()
): StayBilling {
  const reservedNights = Math.max(
    1,
    nightsBetween(input.checkIn, input.checkOut)
  );

  let chargedNights = reservedNights;

  if (input.status === "CHECKED_IN") {
    chargedNights = Math.max(
      reservedNights,
      nightsBetween(input.checkIn, asOf)
    );
  }

  const extraNights = Math.max(0, chargedNights - reservedNights);
  const currentTotal = roundMoney(
    input.totalAmount + input.pricePerNight * extraNights
  );

  return {
    reservedNights,
    chargedNights,
    extraNights,
    currentTotal,
    amountPaid: input.amountPaid,
    balance: Math.max(0, roundMoney(currentTotal - input.amountPaid)),
  };
}
