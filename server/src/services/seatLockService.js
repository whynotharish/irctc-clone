import { redis } from "../redis/client.js";
import { pool } from "../db/pool.js";
import { v4 as uuid } from "uuid";

const LOCK_TTL = parseInt(process.env.SEAT_LOCK_TTL_SECONDS || "300", 10);

/**
 * SEAT LOCKING STRATEGY
 * ---------------------
 * Redis SETNX acts as a distributed lock: only one session can hold
 * the lock for a given seat at a time. TTL auto-expires the lock if
 * checkout/payment isn't completed — this is what prevents seats from
 * being stuck "reserved forever" if a user abandons checkout.
 *
 * Postgres remains the source of truth for final booking state; Redis
 * is just the fast, ephemeral coordination layer for the "hold" window.
 * This mirrors how ticketing systems (airlines, event ticketing) work:
 * short-lived reservation lock -> payment -> commit -> release lock.
 */

function lockKey(seatId) {
  return `seatlock:${seatId}`;
}

/**
 * Attempt to lock a batch of seats atomically-ish:
 * we try each seat with SET NX EX, and if ANY fail, we roll back
 * the ones we already acquired (all-or-nothing for the passenger group).
 */
export async function lockSeats(seatIds, sessionId) {
  const acquired = [];

  for (const seatId of seatIds) {
    const key = lockKey(seatId);
    // SET key value NX EX ttl -> succeeds only if key doesn't exist
    const result = await redis.set(key, sessionId, "NX", "EX", LOCK_TTL);

    if (result === "OK") {
      acquired.push(seatId);
    } else {
      // Someone else holds this seat — roll back what we grabbed
      await releaseSeats(acquired, sessionId);
      return {
        success: false,
        failedSeatId: seatId,
        message: `Seat ${seatId} is already locked by another user`,
      };
    }
  }

  // Reflect the lock in Postgres too, so availability queries stay consistent
  await pool.query(
    `UPDATE seat_inventory SET status = 'locked'
     WHERE id = ANY($1::bigint[]) AND status = 'available'`,
    [acquired]
  );

  return { success: true, lockedSeats: acquired, ttlSeconds: LOCK_TTL };
}

export async function releaseSeats(seatIds, sessionId) {
  if (!seatIds.length) return;

  for (const seatId of seatIds) {
    const key = lockKey(seatId);
    const owner = await redis.get(key);
    // Only release if this session actually owns the lock
    if (owner === sessionId) {
      await redis.del(key);
    }
  }

  await pool.query(
    `UPDATE seat_inventory SET status = 'available'
     WHERE id = ANY($1::bigint[]) AND status = 'locked'`,
    [seatIds]
  );
}

/**
 * Confirm booking: verify session still owns all locks, then
 * atomically mark seats booked + create booking row in one transaction.
 */
export async function confirmBooking({ seatIds, sessionId, userId, trainId, runDate, classType, quota, passengers, fare }) {
  // Verify ownership of every lock before committing
  for (const seatId of seatIds) {
    const owner = await redis.get(lockKey(seatId));
    if (owner !== sessionId) {
      throw new Error(`Lock expired or lost for seat ${seatId}. Please retry booking.`);
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const pnr = generatePNR();
    const bookingResult = await client.query(
      `INSERT INTO bookings (pnr, user_id, train_id, run_date, class_type, quota, status, total_fare)
       VALUES ($1,$2,$3,$4,$5,$6,'CONFIRMED',$7) RETURNING id, pnr`,
      [pnr, userId, trainId, runDate, classType, quota, fare]
    );
    const bookingId = bookingResult.rows[0].id;

    for (let i = 0; i < seatIds.length; i++) {
      await client.query(
        `UPDATE seat_inventory SET status = 'booked', version = version + 1
         WHERE id = $1 AND status = 'locked'`,
        [seatIds[i]]
      );
      const passenger = passengers[i] || {};
      await client.query(
        `INSERT INTO booking_seats (booking_id, seat_inventory_id, passenger_name, passenger_age, passenger_gender)
         VALUES ($1,$2,$3,$4,$5)`,
        [bookingId, seatIds[i], passenger.name, passenger.age, passenger.gender]
      );
    }

    await client.query("COMMIT");

    // Release Redis locks now that Postgres has the durable record
    for (const seatId of seatIds) {
      await redis.del(lockKey(seatId));
    }

    return { pnr, bookingId, status: "CONFIRMED" };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

function generatePNR() {
  // 10-digit numeric PNR, IRCTC-style
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export function newSessionId() {
  return uuid();
}
