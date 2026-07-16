import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Copy, TrainFront, Clock3, XCircle, AlertTriangle } from "lucide-react";
import { api } from "../lib/api";

export default function BookingConfirmation() {
  const { pnr } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState(null);

  useEffect(() => {
    loadBooking();
  }, [pnr]);

  function loadBooking() {
    api.getBooking(pnr).then(setBooking).catch((err) => setError(err.message));
  }

  function copyPNR() {
    navigator.clipboard.writeText(pnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      const result = await api.cancelBooking(pnr);
      setCancelResult(result);
      setShowCancelConfirm(false);
      loadBooking(); // refresh to show CANCELLED status
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  const isWaitlisted = booking?.status === "WAITLISTED";
  const isCancelled = booking?.status === "CANCELLED";
  const isConfirmed = booking?.status === "CONFIRMED";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full bg-(--color-paper-raised) border border-(--color-line) rounded-2xl p-8 text-center shadow-[0_20px_60px_rgba(22,35,63,0.1)]"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 14 }}
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
            isCancelled ? "bg-red-50" : isWaitlisted ? "bg-(--color-marigold)/10" : "bg-(--color-teal-soft)"
          }`}
        >
          {isCancelled && <XCircle className="w-8 h-8 text-(--color-danger)" />}
          {isWaitlisted && <Clock3 className="w-8 h-8 text-(--color-marigold-dark)" />}
          {isConfirmed && <CheckCircle2 className="w-8 h-8 text-(--color-teal)" />}
        </motion.div>

        <h1 className="font-display font-semibold text-2xl mb-1">
          {isCancelled && "Booking cancelled"}
          {isWaitlisted && "You're on the waitlist"}
          {isConfirmed && "Ticket confirmed"}
        </h1>
        <p className="text-(--color-ink-soft) text-sm mb-6">
          {isCancelled && "This ticket has been cancelled. Any freed seat has been offered to the next person in line."}
          {isWaitlisted && `Position ${booking.waitlistPosition ?? "—"} in the queue. You'll be confirmed automatically if a seat opens up.`}
          {isConfirmed && "Your seats are booked. Safe travels."}
        </p>

        {error && <div className="text-(--color-danger) text-sm mb-4">{error}</div>}

        {cancelResult?.promoted?.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-(--color-teal-soft) text-(--color-teal) text-xs">
            Your freed seat was automatically given to the next waitlisted passenger.
          </div>
        )}

        {booking && (
          <>
            <button
              onClick={copyPNR}
              className="w-full flex items-center justify-between bg-(--color-paper) rounded-xl px-4 py-3 mb-4 hover:bg-(--color-line)/30 transition-colors"
            >
              <div className="text-left">
                <div className="text-xs text-(--color-ink-soft)">PNR</div>
                <div className="font-mono font-semibold text-lg tracking-wide">{pnr}</div>
              </div>
              <span className="text-xs text-(--color-ink-soft) flex items-center gap-1">
                <Copy className="w-3.5 h-3.5" /> {copied ? "Copied" : "Copy"}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-3 text-left mb-6">
              <div className="bg-(--color-paper) rounded-xl px-4 py-3">
                <div className="text-xs text-(--color-ink-soft)">Status</div>
                <div className={`font-medium ${
                  isCancelled ? "text-(--color-danger)" : isWaitlisted ? "text-(--color-marigold-dark)" : "text-(--color-teal)"
                }`}>
                  {booking.status}{isWaitlisted && booking.waitlistPosition ? ` #${booking.waitlistPosition}` : ""}
                </div>
              </div>
              <div className="bg-(--color-paper) rounded-xl px-4 py-3">
                <div className="text-xs text-(--color-ink-soft)">Class</div>
                <div className="font-mono font-medium">{booking.class_type}</div>
              </div>
              <div className="bg-(--color-paper) rounded-xl px-4 py-3">
                <div className="text-xs text-(--color-ink-soft)">Date</div>
                <div className="font-medium">{String(booking.run_date).split("T")[0]}</div>
              </div>
              <div className="bg-(--color-paper) rounded-xl px-4 py-3">
                <div className="text-xs text-(--color-ink-soft)">Fare paid</div>
                <div className="font-medium">₹{Number(booking.total_fare).toLocaleString("en-IN")}</div>
              </div>
            </div>

            {!isCancelled && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full py-3 rounded-xl border border-(--color-line) text-(--color-danger) text-sm font-medium hover:bg-red-50 transition-colors mb-4"
              >
                Cancel this booking
              </button>
            )}
          </>
        )}

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-(--color-ink) hover:text-(--color-marigold-dark) transition-colors"
        >
          <TrainFront className="w-4 h-4" /> Book another journey
        </Link>
      </motion.div>

      {/* Cancel confirmation modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-10"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
            >
              <AlertTriangle className="w-8 h-8 text-(--color-marigold-dark) mb-3" />
              <h2 className="font-display font-semibold text-lg mb-2">Cancel this booking?</h2>
              <p className="text-sm text-(--color-ink-soft) mb-5">
                This can't be undone. If someone's waiting for a seat on this train,
                they'll be confirmed automatically once you cancel.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-(--color-line) text-sm font-medium hover:bg-(--color-paper) transition-colors"
                >
                  Keep booking
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-2.5 rounded-xl bg-(--color-danger) text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {cancelling ? "Cancelling…" : "Yes, cancel"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
