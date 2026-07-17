import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2 } from "lucide-react";
import { api } from "../lib/api";

/**
 * Replaces a plain <select> with a real search-as-you-type picker —
 * necessary now that there are ~9,000 real stations, not 5 fixed ones.
 * Debounces requests and shows a small dropdown of matches.
 */
export default function StationAutocomplete({ label, value, onChange, placeholder }) {
  const [query, setQuery] = useState(value?.label || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Keep the visible text in sync if the parent changes value externally (e.g. swap button)
  useEffect(() => {
    setQuery(value?.label || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInput(e) {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 1) {
      setResults([]);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.searchStations(val.trim());
        setResults(data.stations || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }

  function selectStation(station) {
    const label = `${station.code} — ${station.name}`;
    setQuery(label);
    setOpen(false);
    onChange({ code: station.code, label });
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-(--color-ink-soft) mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || "Station name or code"}
          autoComplete="off"
          className="w-full border border-white/70 rounded-xl pl-4 pr-9 py-3 font-mono text-sm focus:border-(--color-marigold) outline-none transition-all bg-white/70 hover:bg-white/90"
        />
        {loading ? (
          <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-(--color-ink-soft) animate-spin" />
        ) : (
          <MapPin className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-(--color-ink-soft)/50" />
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 mt-2 w-full max-h-64 overflow-y-auto glass-solid rounded-xl py-1.5"
          >
            {results.map((s) => (
              <li key={s.code}>
                <button
                  type="button"
                  onClick={() => selectStation(s)}
                  className="w-full text-left px-4 py-2.5 hover:bg-(--color-marigold)/10 transition-colors flex items-center justify-between gap-2"
                >
                  <span>
                    <span className="font-mono text-sm font-medium">{s.code}</span>
                    <span className="text-sm text-(--color-ink-soft) ml-2">{s.name}</span>
                  </span>
                  {s.city && (
                    <span className="text-xs text-(--color-ink-soft)/70 shrink-0">{s.city}</span>
                  )}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
