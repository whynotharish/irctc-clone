import { lockSeats, releaseSeats, confirmBooking, newSessionId } from "../services/seatLockService.js";
import { joinWaitlist, getWaitlistPosition, promoteNextInQueue } from "../services/waitlistService.js";
import { pool } from "../db/pool.js";

// Step 1: user selects seats -> attempt to lock them for the hold window
export async function lockSeatsHandler(req, res) {
  const { seatIds } = req.body;
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ error: "seatIds array required" });
  }

  const sessionId = req.body.sessionId || newSessionId();

  try {
    const result = await lockSeats(seatIds, sessionId);
    if (!result.success) {
      return res.status(409).json(result); // 409 Conflict — seat taken
    }
    res.json({ ...result, sessionId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to lock seats" });
  }
}

// Step 2: "payment" (mocked) -> confirm booking, commit to Postgres
export async function confirmBookingHandler(req, res) {
  const { seatIds, sessionId, userId, trainId, runDate, classType, quota, passengers, fare } = req.body;

  try {
    await mockPaymentGateway();

    const booking = await confirmBooking({
      seatIds, sessionId, userId, trainId, runDate,
      classType, quota: quota || "GENERAL", passengers, fare,
    });

    res.json(booking);
  } catch (err) {
    console.error(err);
    await releaseSeats(seatIds, sessionId);
    res.status(400).json({ error: err.message || "Booking failed" });
  }
}

// No seats available -> join the FIFO waitlist for this train/date/class instead.
// No seat lock needed here since there's no seat to lock yet.
export async function joinWaitlistHandler(req, res) {
  const { userId, trainId, runDate, classType, quota, passengers, fare } = req.body;

  if (!trainId || !runDate || !classType) {
    return res.status(400).json({ error: "trainId, runDate, and classType are required" });
  }

  try {
    await mockPaymentGateway(); // waitlist bookings still collect payment upfront, like real IRCTC tatkal/waitlist
    const result = await joinWaitlist({ userId, trainId, runDate, classType, quota, passengers, fare });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || "Failed to join waitlist" });
  }
}

export async function cancelBookingHandler(req, res) {
  const { pnr } = req.params;
  try {
    const bookingResult = await pool.query(
      `SELECT id, train_id, run_date, class_type, status FROM bookings WHERE pnr = $1`,
      [pnr]
    );
    if (bookingResult.rowCount === 0) {
      return res.status(404).json({ error: "PNR not found" });
    }
    const booking = bookingResult.rows[0];

    if (booking.status === "CANCELLED") {
      return res.status(400).json({ error: "Booking already cancelled" });
    }

    // Grab the seat ids this booking held (waitlisted bookings will have none)
    const seatRows = await pool.query(
      `SELECT seat_inventory_id FROM booking_seats WHERE booking_id = $1 AND seat_inventory_id IS NOT NULL`,
      [booking.id]
    );
    const freedSeatIds = seatRows.rows.map((r) => r.seat_inventory_id);

    await pool.query(`UPDATE bookings SET status = 'CANCELLED' WHERE id = $1`, [booking.id]);

    // If this was a waitlisted booking with no seat, just remove it from the queue
    // and shift everyone behind it up.
    if (booking.status === "WAITLISTED") {
      await pool.query(
        `WITH removed AS (
           DELETE FROM waitlist WHERE booking_id = $1 RETURNING position
         )
         UPDATE waitlist SET position = position - 1
         WHERE train_id = $2 AND run_date = $3 AND class_type = $4
           AND position > (SELECT position FROM removed)`,
        [booking.id, booking.train_id, booking.run_date, booking.class_type]
      );
      return res.json({ pnr, status: "CANCELLED" });
    }

    // Otherwise, free each seat and try to promote the next person in line
    // for that seat. If nobody's waiting, the seat just becomes available.
    const promotions = [];
    for (const seatId of freedSeatIds) {
      const promotion = await promoteNextInQueue({
        trainId: booking.train_id,
        runDate: booking.run_date,
        classType: booking.class_type,
        freedSeatId: seatId,
      });
      if (promotion) {
        promotions.push(promotion.promotedPnr);
      } else {
        await pool.query(`UPDATE seat_inventory SET status = 'available' WHERE id = $1`, [seatId]);
      }
    }

    res.json({ pnr, status: "CANCELLED", promoted: promotions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cancellation failed" });
  }
}

export async function getBookingStatus(req, res) {
  const { pnr } = req.params;
  try {
    const result = await pool.query(
      `SELECT b.*, json_agg(json_build_object(
          'seat', bs.seat_inventory_id,
          'name', bs.passenger_name,
          'age', bs.passenger_age
       )) AS passengers
       FROM bookings b
       LEFT JOIN booking_seats bs ON bs.booking_id = b.id
       WHERE b.pnr = $1
       GROUP BY b.id`,
      [pnr]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "PNR not found" });

    const booking = result.rows[0];
    if (booking.status === "WAITLISTED") {
      booking.waitlistPosition = await getWaitlistPosition(booking.id);
    }

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lookup failed" });
  }
}

function mockPaymentGateway() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.05) reject(new Error("Payment declined (simulated)"));
      else resolve();
    }, 400);
  });
}
