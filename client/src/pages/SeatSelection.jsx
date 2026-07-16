import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Armchair, Timer, AlertCircle, Users } from "lucide-react";
import { api } from "../lib/api";

export default function SeatSelection() {
  const { trainId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const date = params.get("date");
  const classType = params.get("classType") || "3A";

  const [seatMap, setSeatMap] = useState(null); // { seats, availableCount, totalCount }
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [locking, setLocking] = useState(false);
  const [lockError, setLockError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [sessionId] = useState(() => `session-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    api
      .getSeatMap(trainId, date, classType)
      .then(setSeatMap)
      .catch((err) => setLoadError(err.message));
  }, [trainId, date, classType]);

  // Countdown once a lock is acquired
  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      setLockError("Your seat hold expired. Please select seats again.");
      setSelected([]);
      setSecondsLeft(null);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  function toggleSeat(seat) {
    if (seat.status !== "available") return;
    setLockError(null);
    setSelected((prev) =>
      prev.includes(seat.id) ? prev.filter((id) => id !== seat.id) : [...prev, seat.id]
    );
  }

  const handleContinue = useCallback(async () => {
    if (selected.length === 0) return;
    setLocking(true);
    setLockError(null);
    try {
      const result = await api.lockSeats(selected, sessionId);
      setSecondsLeft(result.ttlSeconds || 300);
      navigate(
        `/trains/${trainId}/passengers?date=${date}&classType=${classType}&seats=${selected.join(",")}&sessionId=${sessionId}`
      );
    } catch (err) {
      setLockError(err.data?.message || err.message || "Couldn't hold those seats — someone may have just taken one. Try another.");
      setSelected([]);
      // Refresh seat map since availability just changed under us
      api.getSeatMap(trainId, date, classType).then(setSeatMap).catch(() => {});
    } finally {
      setLocking(false);
    }
  }, [selected, sessionId, navigate, trainId, date, classType]);

  function goToWaitlist() {
    navigate(`/trains/${trainId}/waitlist?date=${date}&classType=${classType}`);
  }

  const fareEach = 1450;
  const noSeatsAvailable = seatMap && seatMap.availableCount === 0;

  return (
    <div className="min-h-screen">
      <header className="max-w-3xl mx-auto px-6 pt-8 pb-2 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full border border-(--color-line) flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="font-display font-semibold text-lg">Choose your seats</div>
          <div className="text-sm text-(--color-ink-soft) font-mono">
            {classType} · {date}
            {seatMap && (
              <span className="ml-2 text-(--color-teal)">
                {seatMap.availableCount} of {seatMap.totalCount} available
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pb-32">
        {loadError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 text-(--color-danger) text-sm">
            {loadError}
          </div>
        )}

        {!seatMap && !loadError && (
          <div className="mt-10 grid grid-cols-4 gap-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-(--color-line)/40 animate-pulse" />
            ))}
          </div>
        )}

        <AnimatePresence>
          {lockError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 mb-2 p-4 rounded-xl bg-red-50 text-(--color-danger) text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {lockError}
            </motion.div>
          )}
        </AnimatePresence>

        {noSeatsAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-(--color-paper-raised) border border-(--color-line) rounded-2xl p-8 text-center"
          >
            <Users className="w-9 h-9 mx-auto mb-3 text-(--color-marigold-dark)" />
            <div className="font-display font-semibold text-lg mb-1">This class is full</div>
            <p className="text-(--color-ink-soft) text-sm mb-5 max-w-sm mx-auto">
              No seats are free right now, but you can join the waitlist — you'll be
              confirmed automatically if a seat opens up from a cancellation.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={goToWaitlist}
              className="px-6 py-3 rounded-xl bg-(--color-marigold) text-white font-medium hover:bg-(--color-marigold-dark) transition-colors"
            >
              Join the waitlist
            </motion.button>
          </motion.div>
        )}

        {seatMap && !noSeatsAvailable && (
          <>
            <div className="flex gap-5 mt-6 mb-6 text-sm text-(--color-ink-soft)">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-white border border-(--color-line)" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-(--color-marigold)" /> Selected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-(--color-ink-soft)/30" /> Booked / locked
              </span>
            </div>

            <div className="bg-(--color-paper-raised) border border-(--color-line) rounded-2xl p-6">
              <div className="grid grid-cols-4 gap-3">
                {seatMap.seats.map((seat, i) => {
                  const isSelected = selected.includes(seat.id);
                  const isTaken = seat.status !== "available";
                  return (
                    <motion.button
                      key={seat.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, delay: i * 0.012 }}
                      whileTap={!isTaken ? { scale: 0.94 } : {}}
                      disabled={isTaken}
                      onClick={() => toggleSeat(seat)}
                      aria-pressed={isSelected}
                      aria-label={`Seat ${seat.seat_number}${isTaken ? ", unavailable" : isSelected ? ", selected" : ", available"}`}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 font-mono text-sm font-medium transition-colors border
                        ${isTaken ? "bg-(--color-ink-soft)/10 text-(--color-ink-soft)/50 border-transparent cursor-not-allowed" : ""}
                        ${isSelected ? "bg-(--color-marigold) text-white border-(--color-marigold)" : ""}
                        ${!isTaken && !isSelected ? "bg-white border-(--color-line) hover:border-(--color-marigold) text-(--color-ink)" : ""}
                      `}
                    >
                      <Armchair className="w-4 h-4" />
                      {seat.seat_number}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>

      {seatMap && !noSeatsAvailable && (
        <div className="fixed bottom-0 left-0 right-0 bg-(--color-paper-raised) border-t border-(--color-line)">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-(--color-ink-soft)">
                {selected.length} seat{selected.length !== 1 ? "s" : ""} selected
              </div>
              <div className="font-display font-semibold text-lg">
                ₹{(selected.length * fareEach).toLocaleString("en-IN")}
              </div>
            </div>

            {secondsLeft !== null && (
              <div className="flex items-center gap-1.5 text-sm font-mono text-(--color-marigold-dark)">
                <Timer className="w-4 h-4" />
                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")} held
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={selected.length === 0 || locking}
              onClick={handleContinue}
              className="px-6 py-3 rounded-xl bg-(--color-ink) text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-(--color-ink)/90 transition-colors"
            >
              {locking ? "Holding seats…" : "Continue"}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
