import { Router } from "express";
import { searchTrains, getAvailability, getSeatMap, searchStations } from "../controllers/trainController.js";
import {
  lockSeatsHandler,
  confirmBookingHandler,
  joinWaitlistHandler,
  cancelBookingHandler,
  getBookingStatus,
} from "../controllers/bookingController.js";

const router = Router();

// Train search & availability
router.get("/trains/search", searchTrains);
router.get("/stations/search", searchStations);
router.get("/trains/:id/availability", getAvailability);
router.get("/trains/:id/seats", getSeatMap);

// Booking flow
router.post("/bookings/lock-seats", lockSeatsHandler);
router.post("/bookings/confirm", confirmBookingHandler);
router.post("/bookings/waitlist", joinWaitlistHandler);
router.delete("/bookings/:pnr", cancelBookingHandler);
router.get("/bookings/:pnr", getBookingStatus);

export default router;
