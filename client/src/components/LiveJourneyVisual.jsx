import { motion } from "framer-motion";

const STATIONS = [
  { code: "NDLS", label: "New Delhi", x: 30, y: 265, delay: 0 },
  { code: "MAS", label: "Chennai", x: 370, y: 90, delay: 1.6 },
  { code: "BBS", label: "Bhubaneswar", x: 690, y: 265, delay: 4.8 },
  { code: "HWH", label: "Howrah", x: 860, y: 60, delay: 8 },
];

const PATH_D =
  "M 30 265 C 190 265 210 90 370 90 S 555 265 690 265 S 815 105 860 60";

/**
 * The signature element: a winding route the train glides along
 * continuously (CSS offset-path, looped), with a soft trailing glow
 * and stations that pulse in sequence as the train approaches them.
 * This is the one bold, bespoke moment of the page — everything else
 * stays quiet and functional around it.
 */
export default function LiveJourneyVisual() {
  return (
    <div className="relative w-full">
      <svg viewBox="0 0 900 320" className="w-full h-auto" aria-hidden="true">
        <defs>
          <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F2994A" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0F1B33" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Base route line */}
        <path
          d={PATH_D}
          fill="none"
          stroke="url(#routeGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 10"
        />

        {/* Station nodes with staggered pulse rings */}
        {STATIONS.map((s) => (
          <g key={s.code}>
            <motion.circle
              cx={s.x}
              cy={s.y}
              r="14"
              fill="none"
              stroke="#F2994A"
              strokeWidth="2"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.5, 0], scale: [0.6, 1.6, 1.6] }}
              transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 7.6, delay: s.delay, ease: "easeOut" }}
            />
            <circle cx={s.x} cy={s.y} r="5" fill="#0F1B33" />
            <text
              x={s.x}
              y={s.y - 22}
              textAnchor="middle"
              className="font-mono"
              fontSize="13"
              fontWeight="600"
              fill="#0F1B33"
            >
              {s.code}
            </text>
            <text
              x={s.x}
              y={s.y + 30}
              textAnchor="middle"
              fontSize="11"
              fill="#57647A"
            >
              {s.label}
            </text>
          </g>
        ))}
      </svg>

      {/* The glowing trail behind the train — same offset-path, slight animation delay */}
      <div
        className="journey-glow absolute top-0 left-0 w-6 h-6 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(242,153,74,0.55) 0%, transparent 70%)",
          filter: "blur(4px)",
        }}
      />

      {/* The train itself, gliding continuously along the route */}
      <div className="journey-path absolute top-0 left-0 pointer-events-none">
        <svg width="34" height="20" viewBox="0 0 34 20">
          <rect x="0" y="3" width="24" height="12" rx="4" fill="#0F1B33" />
          <path d="M24 3 C 30 3.5 33 7 34 10 C 33 13 30 16.5 24 17 Z" fill="#0F1B33" />
          <rect x="0" y="12.5" width="24" height="2" fill="#F2994A" />
          <circle cx="6" cy="17" r="2" fill="#0F1B33" />
          <circle cx="18" cy="17" r="2" fill="#0F1B33" />
        </svg>
      </div>
    </div>
  );
}
