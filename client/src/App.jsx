import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import SeatSelection from "./pages/SeatSelection";
import JoinWaitlist from "./pages/JoinWaitlist";
import PassengerDetails from "./pages/PassengerDetails";
import BookingConfirmation from "./pages/BookingConfirmation";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/trains/:trainId/seats" element={<SeatSelection />} />
        <Route path="/trains/:trainId/waitlist" element={<JoinWaitlist />} />
        <Route path="/trains/:trainId/passengers" element={<PassengerDetails />} />
        <Route path="/bookings/:pnr" element={<BookingConfirmation />} />
      </Routes>
    </BrowserRouter>
  );
}
