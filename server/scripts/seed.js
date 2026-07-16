import { pool } from "../src/db/pool.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const schema = fs.readFileSync(path.join(__dirname, "../src/db/schema.sql"), "utf8");
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`); // for gen_random_uuid()
  await pool.query(schema);

  await pool.query(`
    INSERT INTO stations (code, name, city) VALUES
      ('NDLS', 'New Delhi', 'Delhi'),
      ('BCT', 'Mumbai Central', 'Mumbai'),
      ('MAS', 'Chennai Central', 'Chennai'),
      ('HWH', 'Howrah', 'Kolkata'),
      ('SBC', 'Bengaluru City', 'Bengaluru')
    ON CONFLICT (code) DO NOTHING;
  `);

  const trainResult = await pool.query(`
    INSERT INTO trains (number, name, source_code, destination_code, runs_on)
    VALUES ('12301', 'Rajdhani Express', 'NDLS', 'HWH', ARRAY['MON','WED','FRI'])
    ON CONFLICT (number) DO NOTHING
    RETURNING id;
  `);

  const trainId = trainResult.rows[0]?.id ||
    (await pool.query(`SELECT id FROM trains WHERE number = '12301'`)).rows[0].id;

  await pool.query(`
    INSERT INTO routes (train_id, station_code, sequence, arrival_offset_min, departure_offset_min, distance_km)
    VALUES
      ($1, 'NDLS', 1, 0, 0, 0),
      ($1, 'MAS', 2, 600, 610, 800),
      ($1, 'HWH', 3, 1200, 1200, 1450)
    ON CONFLICT DO NOTHING;
  `, [trainId]);

  const coachResult = await pool.query(`
    INSERT INTO coaches (train_id, class_type, coach_code, total_seats)
    VALUES ($1, '3A', 'B1', 64)
    RETURNING id;
  `, [trainId]);
  const coachId = coachResult.rows[0].id;

  // Seed 64 seats for a specific run date
  const runDate = "2026-08-01";
  const values = [];
  for (let i = 1; i <= 64; i++) {
    values.push(`(${coachId}, ${i}, '${runDate}', 'available')`);
  }
  await pool.query(`
    INSERT INTO seat_inventory (coach_id, seat_number, run_date, status)
    VALUES ${values.join(",")}
    ON CONFLICT (coach_id, seat_number, run_date) DO NOTHING;
  `);

  console.log(`Seeded train ${trainId}, coach ${coachId}, 64 seats for ${runDate}`);

  // Seed a small, nearly-full 2A coach so the waitlist flow is easy to demo
  const smallCoachResult = await pool.query(`
    INSERT INTO coaches (train_id, class_type, coach_code, total_seats)
    VALUES ($1, '2A', 'A1', 6)
    RETURNING id;
  `, [trainId]);
  const smallCoachId = smallCoachResult.rows[0].id;

  const smallValues = [];
  for (let i = 1; i <= 6; i++) {
    // Only seat 6 stays available — everything else pre-booked
    const status = i === 6 ? "available" : "booked";
    smallValues.push(`(${smallCoachId}, ${i}, '${runDate}', '${status}')`);
  }
  await pool.query(`
    INSERT INTO seat_inventory (coach_id, seat_number, run_date, status)
    VALUES ${smallValues.join(",")}
    ON CONFLICT (coach_id, seat_number, run_date) DO NOTHING;
  `);

  console.log(`Seeded small 2A coach ${smallCoachId} (5/6 booked) for waitlist demo — book seat 6, then try again to see the waitlist flow.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
