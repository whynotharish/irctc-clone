/**
 * Simulates a "tatkal rush": many concurrent sessions racing to lock
 * the SAME small pool of seats. Demonstrates that the Redis SETNX lock
 * prevents double-booking under concurrency — only N sessions succeed
 * where N = number of seats, everyone else gets a clean 409 conflict.
 *
 * Usage: node scripts/loadTestTatkal.js
 */

const API = "http://localhost:4000/api";
const NUM_CONCURRENT_USERS = 50;
const SEAT_IDS_UNDER_CONTENTION = [1, 2, 3]; // only 3 seats, 50 users racing for them

async function attemptLock(userIndex) {
  const sessionId = `loadtest-user-${userIndex}`;
  const seatId = SEAT_IDS_UNDER_CONTENTION[userIndex % SEAT_IDS_UNDER_CONTENTION.length];

  const res = await fetch(`${API}/bookings/lock-seats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seatIds: [seatId], sessionId }),
  });

  const data = await res.json();
  return { userIndex, seatId, status: res.status, success: data.success === true };
}

async function main() {
  console.log(`Simulating ${NUM_CONCURRENT_USERS} concurrent users racing for ${SEAT_IDS_UNDER_CONTENTION.length} seats...\n`);

  const results = await Promise.all(
    Array.from({ length: NUM_CONCURRENT_USERS }, (_, i) => attemptLock(i))
  );

  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Succeeded: ${succeeded.length} (should equal number of contested seats)`);
  console.log(`❌ Failed (409 conflict): ${failed.length}`);
  console.log("\nSuccessful locks:", succeeded.map((r) => `user${r.userIndex}->seat${r.seatId}`));

  if (succeeded.length === SEAT_IDS_UNDER_CONTENTION.length) {
    console.log("\n✔ PASS: Exactly one user locked each seat — no double-booking under concurrency.");
  } else {
    console.log("\n✘ Unexpected result — check for race condition bugs.");
  }
}

main().catch(console.error);
