import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, User, Users, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";

export default function JoinWaitlist() {
  const { trainId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const date = params.get("date");
  const classType = params.get("classType");

  const [passengers, setPassengers] = useState([{ name: "", age: "", gender: "M" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function updatePassenger(i, field, value) {
    setPassengers((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  }

  function addPassenger() {
    if (passengers.length >= 4) return;
    setPassengers((prev) => [...prev, { name: "", age: "", gender: "M" }]);
  }

  const fareEach = 1450;
  const total = passengers.length * fareEach;

  async function handleJoin(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.joinWaitlist({
        userId: null,
        trainId: Number(trainId),
        runDate: date,
        classType,
        quota: "GENERAL",
        passengers: passengers.map((p) => ({ ...p, age: Number(p.age) })),
        fare: total,
      });
      navigate(`/bookings/${result.pnr}`);
    } catch (err) {
      setError(err.data?.error || err.message || "Couldn't join the waitlist. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="max-w-2xl mx-auto px-6 pt-8 pb-2 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full border border-(--color-line) flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="font-display font-semibold text-lg">Join the waitlist</div>
          <div className="text-sm text-(--color-ink-soft) font-mono">{classType} · {date}</div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 mb-6 bg-(--color-teal-soft) border border-(--color-teal)/20 rounded-2xl p-5 flex gap-3"
        >
          <Users className="w-5 h-5 text-(--color-teal) shrink-0 mt-0.5" />
          <p className="text-sm text-(--color-ink)">
            You'll be added to the queue in the order you join. If any confirmed
            passenger cancels, the next person in line is automatically confirmed
            — no need to keep checking back.
          </p>
        </motion.div>

        <form onSubmit={handleJoin} className="space-y-4">
          {passengers.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="bg-(--color-paper-raised) border border-(--color-line) rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4 text-sm font-medium text-(--color-ink-soft)">
                <User className="w-4 h-4" />
                Passenger {i + 1}
              </div>
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-3">
                <div>
                  <label className="block text-xs text-(--color-ink-soft) mb-1">Full name</label>
                  <input
                    required
                    value={p.name}
                    onChange={(e) => updatePassenger(i, "name", e.target.value)}
                    className="w-full border border-(--color-line) rounded-lg px-3 py-2.5 text-sm focus:border-(--color-marigold) outline-none"
                    placeholder="As per ID proof"
                  />
                </div>
                <div>
                  <label className="block text-xs text-(--color-ink-soft) mb-1">Age</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="120"
                    value={p.age}
                    onChange={(e) => updatePassenger(i, "age", e.target.value)}
                    className="w-full border border-(--color-line) rounded-lg px-3 py-2.5 text-sm focus:border-(--color-marigold) outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-(--color-ink-soft) mb-1">Gender</label>
                  <select
                    value={p.gender}
                    onChange={(e) => updatePassenger(i, "gender", e.target.value)}
                    className="w-full border border-(--color-line) rounded-lg px-3 py-2.5 text-sm focus:border-(--color-marigold) outline-none bg-white"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
              </div>
            </motion.div>
          ))}

          {passengers.length < 4 && (
            <button
              type="button"
              onClick={addPassenger}
              className="text-sm font-medium text-(--color-marigold-dark) hover:underline"
            >
              + Add another passenger
            </button>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-(--color-danger) text-sm">{error}</div>
          )}

          <div className="bg-(--color-paper-raised) border border-(--color-line) rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-(--color-ink-soft)">
              <ShieldCheck className="w-4 h-4 text-(--color-teal)" />
              Total for {passengers.length} passenger{passengers.length !== 1 ? "s" : ""}
            </div>
            <div className="font-display font-semibold text-xl">₹{total.toLocaleString("en-IN")}</div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-(--color-marigold) text-white font-medium hover:bg-(--color-marigold-dark) transition-colors disabled:opacity-60"
          >
            {submitting ? "Joining…" : `Pay ₹${total.toLocaleString("en-IN")} & join waitlist`}
          </motion.button>
        </form>
      </main>
    </div>
  );
}
