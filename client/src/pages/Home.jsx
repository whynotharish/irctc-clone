import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRightLeft, Search, TrainFront } from "lucide-react";
import JourneyLine from "../components/JourneyLine";

const POPULAR_STATIONS = [
  { code: "NDLS", label: "New Delhi" },
  { code: "BCT", label: "Mumbai Central" },
  { code: "MAS", label: "Chennai Central" },
  { code: "HWH", label: "Howrah" },
  { code: "SBC", label: "Bengaluru City" },
];

export default function Home() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("NDLS");
  const [to, setTo] = useState("HWH");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [heroProgress, setHeroProgress] = useState(0);

  // Animate the hero journey line in once on load
  useState(() => {
    const t = setTimeout(() => setHeroProgress(1), 300);
    return () => clearTimeout(t);
  });

  function swapStations() {
    setFrom(to);
    setTo(from);
  }

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/search?from=${from}&to=${to}&date=${date}`);
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="max-w-5xl mx-auto px-6 pt-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-(--color-ink) flex items-center justify-center">
          <TrainFront className="w-5 h-5 text-(--color-marigold)" strokeWidth={2} />
        </div>
        <span className="font-display font-semibold text-lg tracking-tight">Saarthi</span>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-14 pb-10">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-(--color-ink) max-w-2xl leading-[1.1]"
        >
          Book your train.
          <br />
          <span className="text-(--color-marigold-dark)">Watch your journey unfold.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-(--color-ink-soft) text-lg max-w-xl"
        >
          Search, pick your seat, and get a confirmed ticket in minutes — built to be
          easy for everyone, from your first booking to your fiftieth.
        </motion.p>

        {/* Signature journey line as hero visual */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 mb-4 bg-(--color-paper-raised) rounded-2xl border border-(--color-line) px-8 py-6"
        >
          <JourneyLine
            stations={[
              { code: "NDLS", label: "New Delhi" },
              { code: "MAS", label: "Chennai" },
              { code: "HWH", label: "Howrah" },
            ]}
            progress={heroProgress}
          />
        </motion.div>
      </section>

      {/* Search card */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="max-w-5xl mx-auto px-6"
      >
        <form
          onSubmit={handleSearch}
          className="bg-(--color-paper-raised) border border-(--color-line) rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(22,35,63,0.06)]"
        >
          <div className="grid md:grid-cols-[1fr_auto_1fr_1fr_auto] gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-(--color-ink-soft) mb-1.5">
                From
              </label>
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full border border-(--color-line) rounded-xl px-4 py-3 font-mono text-sm focus:border-(--color-marigold) outline-none transition-colors bg-white"
              >
                {POPULAR_STATIONS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={swapStations}
              aria-label="Swap stations"
              className="mb-1 w-11 h-11 rounded-full border border-(--color-line) flex items-center justify-center hover:bg-(--color-paper) hover:rotate-180 transition-all duration-300"
            >
              <ArrowRightLeft className="w-4 h-4 text-(--color-ink-soft)" />
            </button>

            <div>
              <label className="block text-sm font-medium text-(--color-ink-soft) mb-1.5">
                To
              </label>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full border border-(--color-line) rounded-xl px-4 py-3 font-mono text-sm focus:border-(--color-marigold) outline-none transition-colors bg-white"
              >
                {POPULAR_STATIONS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-(--color-ink-soft) mb-1.5">
                Date of journey
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-(--color-line) rounded-xl px-4 py-3 text-sm focus:border-(--color-marigold) outline-none transition-colors bg-white"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              type="submit"
              className="h-[50px] px-6 rounded-xl bg-(--color-ink) text-white font-medium flex items-center gap-2 justify-center hover:bg-(--color-ink)/90 transition-colors"
            >
              <Search className="w-4 h-4" />
              Search trains
            </motion.button>
          </div>
        </form>
      </motion.section>

      <footer className="max-w-5xl mx-auto px-6 py-16 text-sm text-(--color-ink-soft)">
        A portfolio rebuild — not affiliated with Indian Railways or IRCTC.
      </footer>
    </div>
  );
}
