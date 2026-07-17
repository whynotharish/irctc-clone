import { motion } from "framer-motion";

/**
 * Custom illustration of a Vande Bharat-style train — the recognizable
 * aerodynamic nose cone and blue/white livery with the orange accent
 * stripe, since this is what visually signals "modern Indian Railways"
 * at a glance. Built as original SVG (not a photo) so it's fully ours
 * and animates cleanly.
 */
export default function VandeBharatTrain({ className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <motion.svg
        viewBox="0 0 640 220"
        className="w-full h-auto"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B5A8A" />
            <stop offset="100%" stopColor="#16233F" />
          </linearGradient>
          <linearGradient id="stripeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F2994A" />
            <stop offset="100%" stopColor="#D97F2E" />
          </linearGradient>
        </defs>

        {/* Speed lines behind the train, animating leftward to suggest motion */}
        {[0, 1, 2].map((i) => (
          <motion.rect
            key={i}
            x="0"
            y={70 + i * 18}
            height="4"
            rx="2"
            fill="#16233F"
            opacity={0.08}
            initial={{ width: 0, x: 520 }}
            animate={{ width: [0, 70, 0], x: [560, 460, 380] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              repeatDelay: 0.4 + i * 0.2,
              ease: "easeOut",
              delay: i * 0.3,
            }}
          />
        ))}

        {/* Main body */}
        <rect x="90" y="70" width="430" height="70" rx="18" fill="url(#bodyGrad)" />
        {/* Aerodynamic nose cone */}
        <path
          d="M520 70 C 580 72, 615 95, 618 105 C 615 115, 580 138, 520 140 Z"
          fill="url(#bodyGrad)"
        />

        {/* Cockpit window */}
        <path
          d="M545 84 C 575 86, 596 98, 600 105 C 596 112, 575 124, 545 126 Z"
          fill="#AEE3F0"
          opacity="0.9"
        />

        {/* Cabin windows */}
        {[130, 175, 220, 265, 310, 355, 400, 445].map((x, i) => (
          <rect key={i} x={x} y="84" width="30" height="22" rx="4" fill="#AEE3F0" opacity="0.85" />
        ))}

        {/* Orange accent stripe */}
        <rect x="90" y="122" width="428" height="9" fill="url(#stripeGrad)" />
        <path d="M518 122 L520 122 C 545 123, 570 126, 590 131 L 588 138 C 566 133, 542 130, 518 129 Z" fill="url(#stripeGrad)" />

        {/* Undercarriage */}
        <rect x="100" y="138" width="410" height="10" rx="3" fill="#0d1930" />

        {/* Wheels */}
        {[140, 210, 280, 350, 420, 480].map((x, i) => (
          <circle key={i} cx={x} cy="152" r="9" fill="#0d1930" />
        ))}

        {/* Rail track */}
        <line x1="40" y1="168" x2="600" y2="168" stroke="#E4E3DD" strokeWidth="4" />
        {Array.from({ length: 24 }).map((_, i) => (
          <rect key={i} x={50 + i * 24} y="166" width="10" height="8" fill="#E4E3DD" opacity="0.6" />
        ))}
      </motion.svg>
    </div>
  );
}
