import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRightLeft, Search, TrainFront, Sparkles } from "lucide-react";
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
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none fixed top-[-10%] left-[8%] w-[420px] h-[420px] rounded-full bg-(--color-marigold)/20 blur-[100px]" />
      <div className="pointer-events-none fixed top-[5%] right-[5%] w-[380px] h-[380px] rounded-full bg-(--color-teal)/15 blur-[110px]" />

      <header className="max-w-5xl mx-auto px-6 pt-8 flex items-center gap-3 relative z-10">
        <motion.div
          whileHover={{ rotate: -8, scale: 1.05 }}
          className="w-10 h-10 rounded-full bg-(--color-ink) flex items-center justify-center shadow-[0_6px_16px_rgba(22,35,63,0.35)]"
        >
          <TrainFront className="w-5 h-5 text-(--color-marigold)" strokeWidth={2} />
        </motion.div>
        <span className="font-display font-semibold text-lg tracking-tight">Saarthi</span>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-14 pb-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-solid text-xs font-medium text-(--color-marigold-dark) mb-5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          A faster, clearer way to book
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-(--color-ink) max-w-2xl leading-[1.1]"
        >
          Book your train.
          <br />
          <span className="bg-gradient-to-r from-(--color-marigold-dark) to-(--color-marigold) bg-clip-text text-transparent">
            Watch your journey unfold.
          </span>
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

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2 }}
          className="mt-12 mb-4 glass rounded-2xl px-8 py-6"
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

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-5xl mx-auto px-6 relative z-10"
      >
        <form
          onSubmit={handleSearch}
          className="glass rounded-2xl p-6 md:p-8"
        >
          <div className="grid md:grid-cols-[1fr_auto_1fr_1fr_auto] gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-(--color-ink-soft) mb-1.5">
                From
              </label>
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full border border-white/70 rounded-xl px-4 py-3 font-mono text-sm focus:border-(--color-marigold) outline-none transition-all bg-white/70 hover:bg-white/90"
              >
                {POPULAR_STATIONS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.label}
                  </option>
                ))}
              </select>
            </div>

            <motion.button
              type="button"
              onClick={swapStations}
              aria-label="Swap stations"
              whileHover={{ rotate: 180, scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mb-1 w-11 h-11 rounded-full glass-solid flex items-center justify-center"
            >
              <ArrowRightLeft className="w-4 h-4 text-(--color-ink-soft)" />
            </motion.button>

            <div>
              <label className="block text-sm font-medium text-(--color-ink-soft) mb-1.5">
                To
              </label>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full border border-white/70 rounded-xl px-4 py-3 font-mono text-sm focus:border-(--color-marigold) outline-none transition-all bg-white/70 hover:bg-white/90"
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
                className="w-full border border-white/70 rounded-xl px-4 py-3 text-sm focus:border-(--color-marigold) outline-none transition-all bg-white/70 hover:bg-white/90"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.96 }}
              type="submit"
              className="h-[50px] px-6 rounded-xl bg-gradient-to-br from-(--color-ink) to-[#0d1930] text-white font-medium flex items-center gap-2 justify-center shadow-[0_10px_24px_-6px_rgba(22,35,63,0.5)] hover:shadow-[0_14px_30px_-6px_rgba(22,35,63,0.6)] transition-shadow"
            >
              <Search className="w-4 h-4" />
              Search trains
            </motion.button>
          </div>
        </form>
      </motion.section>

      <footer className="max-w-5xl mx-auto px-6 py-16 text-sm text-(--color-ink-soft) relative z-10">
        A portfolio rebuild — not affiliated with Indian Railways or IRCTC.
      </footer>
    </div>
  );
}
