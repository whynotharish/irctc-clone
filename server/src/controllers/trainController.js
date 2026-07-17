import { pool } from "../db/pool.js";

export async function searchTrains(req, res) {
  const { from, to, date } = req.query;

  if (!from || !to || !date) {
    return res.status(400).json({ error: "from, to, and date are required" });
  }

  try {
    const result = await pool.query(
      `SELECT DISTINCT t.id, t.number, t.name, t.source_code, t.destination_code, t.runs_on
       FROM trains t
       JOIN routes r1 ON r1.train_id = t.id AND r1.station_code = $1
       JOIN routes r2 ON r2.train_id = t.id AND r2.station_code = $2
       WHERE r1.sequence < r2.sequence`,
      [from, to]
    );

    res.json({ date, trains: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
}

export async function getAvailability(req, res) {
  const { id } = req.params;
  const { date, classType } = req.query;

  try {
    const result = await pool.query(
      `SELECT c.class_type, c.coach_code,
              COUNT(si.id) FILTER (WHERE si.status = 'available') AS available,
              COUNT(si.id) AS total
       FROM coaches c
       LEFT JOIN seat_inventory si ON si.coach_id = c.id AND si.run_date = $2
       WHERE c.train_id = $1 ${classType ? "AND c.class_type = $3" : ""}
       GROUP BY c.class_type, c.coach_code`,
      classType ? [id, date, classType] : [id, date]
    );

    res.json({ trainId: id, date, availability: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Availability check failed" });
  }
}

// Autocomplete search for stations by code or name — used by the frontend's
// From/To pickers now that we have ~9,000 real stations, not a fixed list.
export async function searchStations(req, res) {
  const { q } = req.query;

  if (!q || q.trim().length < 1) {
    return res.json({ stations: [] });
  }

  try {
    const result = await pool.query(
      `SELECT code, name, city FROM stations
       WHERE code ILIKE $1 || '%' OR name ILIKE '%' || $1 || '%'
       ORDER BY
         CASE WHEN code ILIKE $1 || '%' THEN 0 ELSE 1 END,
         length(name) ASC
       LIMIT 15`,
      [q.trim()]
    );
    res.json({ stations: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Station search failed" });
  }
}

// Real seat-level map: every seat with its actual inventory id + status,
// so the frontend can lock/book real rows instead of a demo layout.
export async function getSeatMap(req, res) {
  const { id } = req.params;
  const { date, classType } = req.query;

  if (!date || !classType) {
    return res.status(400).json({ error: "date and classType are required" });
  }

  try {
    const coachResult = await pool.query(
      `SELECT id, coach_code, total_seats FROM coaches
       WHERE train_id = $1 AND class_type = $2
       ORDER BY coach_code LIMIT 1`,
      [id, classType]
    );

    if (coachResult.rowCount === 0) {
      return res.status(404).json({ error: "No coach found for this class on this train" });
    }

    const coach = coachResult.rows[0];

    const seatResult = await pool.query(
      `SELECT id, seat_number, status FROM seat_inventory
       WHERE coach_id = $1 AND run_date = $2
       ORDER BY seat_number`,
      [coach.id, date]
    );

    const availableCount = seatResult.rows.filter((s) => s.status === "available").length;

    res.json({
      trainId: id,
      coachId: coach.id,
      coachCode: coach.coach_code,
      classType,
      date,
      seats: seatResult.rows,
      availableCount,
      totalCount: seatResult.rows.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load seat map" });
  }
}
