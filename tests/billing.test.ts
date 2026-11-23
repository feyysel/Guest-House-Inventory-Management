import assert from "node:assert/strict";
import test from "node:test";
import { calculateStayBilling } from "../src/lib/reservation-billing.ts";

const checkIn = new Date("2026-11-20T12:00:00.000Z");
const checkOut = new Date("2026-11-23T12:00:00.000Z");

test("calculates reserved nights, total, and balance", () => {
  const billing = calculateStayBilling(
    {
      checkIn,
      checkOut,
      totalAmount: 6000,
      status: "CONFIRMED",
      pricePerNight: 2000,
      amountPaid: 3000,
    },
    new Date("2026-11-21T09:00:00.000Z")
  );

  assert.equal(billing.reservedNights, 3);
  assert.equal(billing.chargedNights, 3);
  assert.equal(billing.extraNights, 0);
  assert.equal(billing.currentTotal, 6000);
  assert.equal(billing.balance, 3000);
});

test("charges extra nights only for checked-in stays", () => {
  const input = {
    checkIn,
    checkOut,
    totalAmount: 6000,
    status: "CHECKED_IN",
    pricePerNight: 2000,
    amountPaid: 7000,
  };
  const asOf = new Date("2026-11-25T09:00:00.000Z");

  const checkedIn = calculateStayBilling(input, asOf);
  const confirmed = calculateStayBilling({ ...input, status: "CONFIRMED" }, asOf);

  assert.equal(checkedIn.extraNights, 2);
  assert.equal(checkedIn.currentTotal, 10000);
  assert.equal(checkedIn.balance, 3000);
  assert.equal(confirmed.extraNights, 0);
  assert.equal(confirmed.balance, 0);
});

test("never charges less than one night and rounds money to cents", () => {
  const billing = calculateStayBilling(
    {
      checkIn,
      checkOut: checkIn,
      totalAmount: 100.005,
      status: "CHECKED_OUT",
      pricePerNight: 10,
      amountPaid: 0,
    },
    checkIn
  );

  assert.equal(billing.reservedNights, 1);
  assert.equal(billing.currentTotal, 100.01);
});
