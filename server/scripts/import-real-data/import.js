/**
 * Imports real Indian Railways train + station data (sourced from the open
 * Datameet dataset — see scripts/import-real-data/convert.py) into the app's
 * Postgres schema.
 *
 * Run scripts/import-real-data/convert.py FIRST to produce stations.csv and
 * trains.csv in this same folder, then run this script:
 *
 *   node scripts/import-real-data/import.js
 *
 * This creates real trains + stations + minimal source->destination routes,
 * generates coaches per train based on its real class flags (SL/3A/2A/1A/CC),
 * and seeds bookable seat_inventory for a single demo date across all of them.
 *
 * NOTE: seat availability itself is still simulated — there is no public,
 * legitimate source for live IRCTC seat availability. Only train identity,
 * station, and route data here is real.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import { pool } from "../../src/db/pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_DATE = "2026-08-01"; // same demo date used by the main seed script
const SEATS_PER_COACH = 24; // kept modest to control total row count across ~2,300 trains

function loadCsv(filename) {
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing ${filename} — run convert.py first (see this script's header comment).`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content, { columns: true, skip_empty_lines: true });
}

async function batchInsert(query, rows, batchSize = 500) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await query(batch);
    if (i % 5000 === 0) console.log(`  ...${i}/${rows.length}`);
  }
}

async function main() {
  console.log("Loading CSVs...");
  const stations = loadCsv("stations.csv");
  const trains = loadCsv("trains.csv");
  console.log(`${stations.length} stations, ${trains.length} trains`);

  // --- Stations ---
  console.log("Importing stations...");
  await batchInsert(async (batch) => {
    const values = [];
    const params = [];
    batch.forEach((s, i) => {
      const base = i * 3;
      values.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
      params.push(s.code, s.name, s.city || null);
    });
    await pool.query(
      `INSERT INTO stations (code, name, city) VALUES ${values.join(",")}
       ON CONFLICT (code) DO NOTHING`,
      params
    );
  }, stations);

  // --- Trains + routes (source seq 1, destination seq 2) ---
  console.log("Importing trains + routes...");
  const ALL_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const trainIdByNumber = new Map();

  for (const t of trains) {
    const result = await pool.query(
      `INSERT INTO trains (number, name, source_code, destination_code, runs_on)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (number) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [t.number, t.name || `Train ${t.number}`, t.source_code, t.destination_code, ALL_DAYS]
    );
    const trainId = result.rows[0].id;
    trainIdByNumber.set(t.number, trainId);

    await pool.query(
      `INSERT INTO routes (train_id, station_code, sequence, distance_km)
       VALUES ($1, $2, 1, 0), ($1, $3, 2, $4)
       ON CONFLICT DO NOTHING`,
      [trainId, t.source_code, t.destination_code, Number(t.distance_km) || 0]
    );
  }
  console.log(`Imported ${trainIdByNumber.size} trains.`);

  // --- Coaches, based on each train's real class flags ---
  console.log("Creating coaches + seeding seat inventory (this is the slow part)...");
  const CLASS_FIELD_MAP = { SL: "sl", "3A": "ac3", "2A": "ac2", "1A": "ac1", CC: "cc" };
  let coachCount = 0;
  let seatCount = 0;

  for (const t of trains) {
    const trainId = trainIdByNumber.get(t.number);
    let coachIndex = 0;

    for (const [classType, field] of Object.entries(CLASS_FIELD_MAP)) {
      if (t[field] !== "True" && t[field] !== "true") continue;

      coachIndex++;
      const coachCode = `${classType}${coachIndex}`;
      const coachResult = await pool.query(
        `INSERT INTO coaches (train_id, class_type, coach_code, total_seats)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [trainId, classType, coachCode, SEATS_PER_COACH]
      );
      const coachId = coachResult.rows[0].id;
      coachCount++;

      // Bulk-insert seats for the demo date in one statement per coach
      const values = [];
      const params = [];
      for (let seatNum = 1; seatNum <= SEATS_PER_COACH; seatNum++) {
        const base = (seatNum - 1) * 4;
        values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
        params.push(coachId, seatNum, DEMO_DATE, "available");
      }
      await pool.query(
        `INSERT INTO seat_inventory (coach_id, seat_number, run_date, status)
         VALUES ${values.join(",")}
         ON CONFLICT (coach_id, seat_number, run_date) DO NOTHING`,
        params
      );
      seatCount += SEATS_PER_COACH;
    }
  }

  console.log(`Created ${coachCount} coaches, ${seatCount} seats for run_date ${DEMO_DATE}.`);
  console.log("Done. Real trains are now searchable/bookable for 2026-08-01.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
