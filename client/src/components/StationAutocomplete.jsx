import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, ChevronRight } from "lucide-react";
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
  const [highlightIndex, setHighlightIndex] = useState(-1);
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
    setHighlightIndex(-1);

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
    if (debounceRef.current) clearTimeout(debounceRef.current); // cancel any stray pending fetch
    const label = `${station.code} — ${station.name}`;
    setQuery(label);
    setOpen(false);
    setResults([]);
    setHighlightIndex(-1);
    onChange({ code: station.code, label });
  }

  function handleKeyDown(e) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      selectStation(results[highlightIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
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
          onKeyDown={handleKeyDown}
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
            className="absolute z-20 mt-2 w-full max-h-72 overflow-y-auto glass-solid rounded-xl py-1 divide-y divide-(--color-line)/60"
          >
            {results.map((s, i) => (
              <li key={s.code}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()} // keep input focus, avoid blur-race
                  onClick={() => selectStation(s)}
                  onMouseEnter={() => setHighlightIndex(i)}
                  className={`w-full text-left pl-4 pr-3 py-3 transition-colors flex items-center justify-between gap-2 group ${
                    highlightIndex === i ? "bg-(--color-marigold)/12" : "hover:bg-(--color-marigold)/8"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="font-mono text-sm font-semibold text-(--color-ink)">{s.code}</span>
                    <span className="text-sm text-(--color-ink-soft) ml-2 truncate">{s.name}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    {s.city && (
                      <span className="text-xs text-(--color-ink-soft)/70 hidden sm:inline">{s.city}</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-(--color-marigold-dark) opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
