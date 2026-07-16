import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, TrainFront, Clock, IndianRupee } from "lucide-react";
import { api } from "../lib/api";

const CLASS_LABELS = { "1A": "AC First", "2A": "AC 2 Tier", "3A": "AC 3 Tier", SL: "Sleeper", CC: "Chair Car" };

export default function SearchResults() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const from = params.get("from");
  const to = params.get("to");
  const date = params.get("date");

  const [trains, setTrains] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTrains(null);
    setError(null);
    api
      .searchTrains(from, to, date)
      .then((data) => setTrains(data.trains || []))
      .catch((err) => setError(err.message));
  }, [from, to, date]);

  return (
    <div className="min-h-screen">
      <header className="max-w-5xl mx-auto px-6 pt-8 pb-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-full border border-(--color-line) flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Back to search"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="font-display font-semibold text-lg flex items-center gap-2">
            <span className="font-mono">{from}</span>
            <span className="text-(--color-ink-soft)">→</span>
            <span className="font-mono">{to}</span>
          </div>
          <div className="text-sm text-(--color-ink-soft)">{date}</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-16">
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 text-(--color-danger) text-sm">
            {error}
          </div>
        )}

        {trains === null && !error && (
          <div className="mt-10 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-(--color-line)/40 animate-pulse" />
            ))}
          </div>
        )}

        {trains && trains.length === 0 && (
          <div className="mt-16 text-center text-(--color-ink-soft)">
            <TrainFront className="w-10 h-10 mx-auto mb-3 opacity-40" />
            No trains found for this route on this date. Try a different date.
          </div>
        )}

        <div className="mt-6 space-y-4">
          {trains?.map((train, i) => (
            <motion.div
              key={train.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
            >
              <Link
                to={`/trains/${train.id}/seats?date=${date}&classType=3A`}
                className="block bg-(--color-paper-raised) border border-(--color-line) rounded-2xl p-5 hover:border-(--color-marigold) hover:shadow-[0_8px_24px_rgba(22,35,63,0.08)] transition-all group"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="font-mono text-xs text-(--color-ink-soft)">
                      #{train.number}
                    </div>
                    <div className="font-display font-semibold text-lg">{train.name}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-(--color-ink-soft)">
                    <Clock className="w-3.5 h-3.5" />
                    Runs: {train.runs_on?.join(", ")}
                  </div>
                  <div className="flex items-center gap-2">
                    {["SL", "3A", "2A", "1A"].map((cls) => (
                      <span
                        key={cls}
                        className="text-xs font-mono px-2.5 py-1 rounded-full bg-(--color-teal-soft) text-(--color-teal) font-medium"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 font-display font-semibold text-(--color-marigold-dark) group-hover:translate-x-0.5 transition-transform">
                    View seats →
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
