const BASE = import.meta.env.VITE_API_URL || "/api";

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  searchStations: (query) =>
    fetch(`${BASE}/stations/search?q=${encodeURIComponent(query)}`).then(handle),

  searchTrains: (from, to, date) =>
    fetch(`${BASE}/trains/search?from=${from}&to=${to}&date=${date}`).then(handle),

  getAvailability: (trainId, date, classType) =>
    fetch(`${BASE}/trains/${trainId}/availability?date=${date}${classType ? `&classType=${classType}` : ""}`).then(handle),

  getSeatMap: (trainId, date, classType) =>
    fetch(`${BASE}/trains/${trainId}/seats?date=${date}&classType=${classType}`).then(handle),

  joinWaitlist: (payload) =>
    fetch(`${BASE}/bookings/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),

  lockSeats: (seatIds, sessionId) =>
    fetch(`${BASE}/bookings/lock-seats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seatIds, sessionId }),
    }).then(handle),

  confirmBooking: (payload) =>
    fetch(`${BASE}/bookings/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),

  getBooking: (pnr) => fetch(`${BASE}/bookings/${pnr}`).then(handle),

  cancelBooking: (pnr) => fetch(`${BASE}/bookings/${pnr}`, { method: "DELETE" }).then(handle),
};
