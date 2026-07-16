import { pool } from "../db/pool.js";

/**
 * WAITLIST STRATEGY
 * -----------------
 * When no seats are available, a booking is created with status
 * WAITLISTED (no seat_inventory row attached yet) and given the next
 * FIFO position in the waitlist table for that train/date/class.
 *
 * When a CONFIRMED booking is cancelled, its seat(s) free up. Rather
 * than just marking seats 'available' and stopping there, we check the
 * waitlist queue for that exact train/date/class: if someone is
 * waiting, the freed seat is handed to whoever is first in line,
 * their booking flips WAITLISTED -> CONFIRMED, and everyone behind
 * them in the queue moves up one position.
 *
 * This mirrors how IRCTC's real waitlist/RAC system works, and is the
 * kind of state-machine logic that's easy to get subtly wrong (e.g.
 * forgetting to renumber positions, or promoting into a seat that's
 * already taken) — so it's covered by a dedicated transaction here.
 */

export async function joinWaitlist({ userId, trainId, runDate, classType, quota, passengers, fare }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const pnr = generatePNR();
    const bookingResult = await client.query(
      `INSERT INTO bookings (pnr, user_id, train_id, run_date, class_type, quota, status, total_fare)
       VALUES ($1,$2,$3,$4,$5,$6,'WAITLISTED',$7) RETURNING id, pnr`,
      [pnr, userId, trainId, runDate, classType, quota || "GENERAL", fare]
    );
    const bookingId = bookingResult.rows[0].id;

    // Next position = current queue length + 1, for this exact train/date/class
    const posResult = await client.query(
      `SELECT COALESCE(MAX(position), 0) + 1 AS next_position
       FROM waitlist WHERE train_id = $1 AND run_date = $2 AND class_type = $3`,
      [trainId, runDate, classType]
    );
    const position = posResult.rows[0].next_position;

    await client.query(
      `INSERT INTO waitlist (train_id, run_date, class_type, booking_id, position)
       VALUES ($1,$2,$3,$4,$5)`,
      [trainId, runDate, classType, bookingId, position]
    );

    // Store passenger info without a seat yet (seat assigned on promotion)
    if (passengers?.length) {
      for (const p of passengers) {
        await client.query(
          `INSERT INTO booking_seats (booking_id, seat_inventory_id, passenger_name, passenger_age, passenger_gender)
           VALUES ($1, NULL, $2, $3, $4)`,
          [bookingId, p.name, p.age, p.gender]
        );
      }
    }

    await client.query("COMMIT");
    return { pnr, bookingId, status: "WAITLISTED", position };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getWaitlistPosition(bookingId) {
  const result = await pool.query(`SELECT position FROM waitlist WHERE booking_id = $1`, [bookingId]);
  return result.rows[0]?.position ?? null;
}

/**
 * Called after a seat frees up (cancellation). Promotes the first
 * person in line for that train/date/class, if anyone is waiting.
 * Returns the promoted booking's PNR, or null if the queue was empty.
 */
export async function promoteNextInQueue({ trainId, runDate, classType, freedSeatId }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the queue row to avoid two cancellations racing to promote
    // into the same freed seat.
    const nextResult = await client.query(
      `SELECT w.id AS waitlist_id, w.booking_id, b.pnr
       FROM waitlist w
       JOIN bookings b ON b.id = w.booking_id
       WHERE w.train_id = $1 AND w.run_date = $2 AND w.class_type = $3
       ORDER BY w.position ASC
       LIMIT 1
       FOR UPDATE OF w`,
      [trainId, runDate, classType]
    );

    if (nextResult.rowCount === 0) {
      // Nobody waiting — just leave the seat available
      await client.query("COMMIT");
      return null;
    }

    const { waitlist_id, booking_id, pnr } = nextResult.rows[0];

    // Assign the freed seat to the first booking_seats row missing a seat
    await client.query(
      `UPDATE booking_seats SET seat_inventory_id = $1
       WHERE id = (
         SELECT id FROM booking_seats
         WHERE booking_id = $2 AND seat_inventory_id IS NULL
         ORDER BY id LIMIT 1
       )`,
      [freedSeatId, booking_id]
    );

    await client.query(`UPDATE seat_inventory SET status = 'booked' WHERE id = $1`, [freedSeatId]);
    await client.query(`UPDATE bookings SET status = 'CONFIRMED' WHERE id = $1`, [booking_id]);
    await client.query(`DELETE FROM waitlist WHERE id = $1`, [waitlist_id]);

    // Shift everyone behind them up by one position
    await client.query(
      `UPDATE waitlist SET position = position - 1
       WHERE train_id = $1 AND run_date = $2 AND class_type = $3`,
      [trainId, runDate, classType]
    );

    await client.query("COMMIT");
    return { promotedPnr: pnr, promotedBookingId: booking_id };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

function generatePNR() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}
