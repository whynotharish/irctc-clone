import { motion } from "framer-motion";

/**
 * The signature visual element of the app: a horizontal route line
 * with station nodes, and a train marker that animates along it.
 * Used across search results, seat selection, and booking progress
 * so the "journey" metaphor threads through the whole flow.
 *
 * progress: 0 to 1, how far along the line the train marker sits
 * stations: [{ code, label }] — rendered as nodes along the line
 */
export default function JourneyLine({ stations, progress = 0, compact = false }) {
  return (
    <div className={compact ? "py-2" : "py-4"}>
      <div className="relative flex items-center">
        {/* Base line */}
        <div className="absolute left-0 right-0 h-[3px] bg-(--color-line) rounded-full" />

        {/* Progress fill */}
        <motion.div
          className="absolute left-0 h-[3px] bg-(--color-marigold) rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Train marker */}
        <motion.div
          className="absolute -top-2.5"
          initial={{ left: "0%" }}
          animate={{ left: `${progress * 100}%` }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginLeft: "-10px" }}
        >
          <div className="w-5 h-5 rounded-full bg-(--color-marigold) shadow-[0_0_0_4px_rgba(242,153,74,0.2)] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </motion.div>

        {/* Station nodes */}
        <div className="w-full flex justify-between relative">
          {stations.map((station, i) => (
            <div key={station.code} className="flex flex-col items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 ${
                  i / (stations.length - 1) <= progress
                    ? "bg-(--color-ink) border-(--color-ink)"
                    : "bg-white border-(--color-line)"
                }`}
              />
              {!compact && (
                <div className="text-center">
                  <div className="font-mono text-xs font-medium text-(--color-ink)">
                    {station.code}
                  </div>
                  <div className="text-[11px] text-(--color-ink-soft) whitespace-nowrap">
                    {station.label}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
