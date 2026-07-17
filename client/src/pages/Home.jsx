import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRightLeft, Search, TrainFront, AlertCircle } from "lucide-react";
import LiveJourneyVisual from "../components/LiveJourneyVisual";
import StationAutocomplete from "../components/StationAutocomplete";

function loadLastSearch() {
  try {
    const saved = sessionStorage.getItem("lastSearch");
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore corrupt/unavailable storage
  }
  return null;
}

export default function Home() {
  const navigate = useNavigate();
  const lastSearch = loadLastSearch();
  const [from, setFrom] = useState(lastSearch?.from || { code: "NDLS", label: "NDLS — New Delhi" });
  const [to, setTo] = useState(lastSearch?.to || { code: "HWH", label: "HWH — Howrah" });
  const [date, setDate] = useState(lastSearch?.date || (() => new Date().toISOString().split("T")[0]));
  const [error, setError] = useState(null);

  function swapStations() {
    setFrom(to);
    setTo(from);
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!from?.code || !to?.code) {
      setError("Pick a station from the dropdown for both From and To.");
      return;
    }
    if (from.code === to.code) {
      setError("From and To can't be the same station.");
      return;
    }
    setError(null);
    sessionStorage.setItem("lastSearch", JSON.stringify({ from, to, date }));
    navigate(`/search?from=${from.code}&to=${to.code}&date=${date}`);
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 pt-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-(--color-ink) flex items-center justify-center">
          <TrainFront className="w-5 h-5 text-(--color-marigold)" strokeWidth={2} />
        </div>
        <span className="font-display font-bold text-lg tracking-tight">Saarthi</span>
      </header>

      {/* Asymmetric hero: visual leads on mobile, sits right on desktop */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-14 grid md:grid-cols-2 gap-10 items-center">
        <div className="order-1 md:order-2 relative">
          <div
            className="absolute -inset-10 rounded-full opacity-60 pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(242,153,74,0.20) 0%, transparent 70%)",
              filter: "blur(30px)",
            }}
          />
          <div className="relative bg-(--color-paper-raised) rounded-3xl border border-(--color-line) px-4 py-8 md:px-6">
            <LiveJourneyVisual />
          </div>
        </div>

        <div className="order-2 md:order-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-3 py-1.5 rounded-full bg-(--color-ink) text-white text-xs font-medium mb-6"
          >
            Real trains. Real routes. Zero IRCTC frustration.
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="font-display font-extrabold text-6xl md:text-7xl leading-[0.95] tracking-tight text-(--color-ink)"
          >
            Book your
            <br />
            <span className="text-(--color-marigold-dark)">train.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-5 text-(--color-ink-soft) text-lg max-w-md"
          >
            Search, pick your seat, and get a confirmed ticket in minutes —
            built to be easy for everyone, from your first booking to your
            fiftieth.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            onSubmit={handleSearch}
            className="mt-8 glass rounded-2xl p-5"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <StationAutocomplete label="From" value={from} onChange={setFrom} placeholder="e.g. New Delhi" />
                </div>
                <motion.button
                  type="button"
                  onClick={swapStations}
                  aria-label="Swap stations"
                  whileHover={{ rotate: 180 }}
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="mb-1.5 w-10 h-10 shrink-0 rounded-full glass-solid flex items-center justify-center"
                >
                  <ArrowRightLeft className="w-4 h-4 text-(--color-ink-soft)" />
                </motion.button>
                <div className="flex-1">
                  <StationAutocomplete label="To" value={to} onChange={setTo} placeholder="e.g. Howrah" />
                </div>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-(--color-ink-soft) mb-1.5">
                    Date of journey
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-white/70 rounded-xl px-4 py-3 text-sm focus:border-(--color-marigold) outline-none transition-all bg-white/70 hover:bg-white/90"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="h-[50px] px-6 rounded-xl bg-(--color-ink) text-white font-semibold flex items-center gap-2 justify-center shadow-[0_10px_24px_-6px_rgba(15,27,51,0.5)] hover:shadow-[0_14px_30px_-6px_rgba(15,27,51,0.6)] transition-shadow shrink-0"
                >
                  <Search className="w-4 h-4" />
                  Search
                </motion.button>
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-sm text-(--color-danger)">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </motion.form>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-16 text-sm text-(--color-ink-soft)">
        A portfolio rebuild — not affiliated with Indian Railways or IRCTC.
      </footer>
    </div>
  );
}
