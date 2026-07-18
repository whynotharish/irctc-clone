import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  TrainFront,
  Users,
  Zap,
} from "lucide-react";
import StationAutocomplete from "../components/StationAutocomplete";

const routes = [
  ["NDLS", "BCT", "New Delhi", "Mumbai Central"],
  ["SBC", "MAS", "Bengaluru", "Chennai"],
  ["HWH", "NJP", "Howrah", "New Jalpaiguri"],
  ["MAS", "CBE", "Chennai", "Coimbatore"],
];

function savedSearch() {
  try {
    return JSON.parse(sessionStorage.getItem("lastSearch"));
  } catch {
    return null;
  }
}

function VandeBharatHero() {
  return (
    <div className="cartoon-train-card" aria-label="Cartoon saffron Vande Bharat train in the mountains">
      <div className="mountain mountain-one" />
      <div className="mountain mountain-two" />
      <div className="cloud cloud-one" />
      <div className="cloud cloud-two" />
      <div className="cartoon-train" role="img" aria-label="Cartoon saffron Vande Bharat Express train">
        <div className="train-nose">
          <div className="windshield" />
          <div className="headlight" />
          <span className="train-logo">वंदे भारत</span>
        </div>
        <div className="coach coach-one">
          <span />
          <span />
          <span />
        </div>
        <div className="coach coach-two">
          <span />
          <span />
          <span />
        </div>
        <div className="wheel wheel-one" />
        <div className="wheel wheel-two" />
        <div className="wheel wheel-three" />
      </div>
      <div className="rail-track" />
      <div className="grass-stripe" />
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const last = savedSearch();
  const [from, setFrom] = useState(last?.from || { code: "NDLS", label: "NDLS — New Delhi" });
  const [to, setTo] = useState(last?.to || { code: "HWH", label: "HWH — Howrah" });
  const [date, setDate] = useState(last?.date || new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");

  function search(event) {
    event.preventDefault();

    if (!from?.code || !to?.code || from.code === to.code) {
      setError("Choose two different stations to continue.");
      return;
    }

    sessionStorage.setItem("lastSearch", JSON.stringify({ from, to, date }));
    navigate(`/search?from=${from.code}&to=${to.code}&date=${date}`);
  }

  function choose([fromCode, toCode, fromName, toName]) {
    setFrom({ code: fromCode, label: `${fromCode} — ${fromName}` });
    setTo({ code: toCode, label: `${toCode} — ${toName}` });
  }

  return (
    <main className="rail-home flash-home">
      <nav className="rail-nav flash-nav">
        <a className="brand flash-brand" href="/" aria-label="RailYatra home">
          <span className="brand-mark"><TrainFront size={19} /></span>
          <span>RAIL<span>YATRA</span></span>
        </a>
        <div className="nav-links">
          <a href="#book">Book now</a>
          <a href="#routes">Flash routes</a>
          <a href="#why">Why us</a>
        </div>
        <button className="nav-login" type="button">Sign in <ChevronRight size={16} /></button>
      </nav>

      <section className="flash-hero">
        <motion.div className="flash-card hero-copy-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <p className="flash-kicker"><Sparkles size={16} /> Saffron Vande Bharat booking</p>
          <h1>BIG TRAIN<br />BIG TRIP<br /><span>BOOK FAST</span></h1>
          <p className="hero-intro">A glossy, card-first rail homepage for quick station search, bold route discovery, and a cartoon saffron Vande Bharat moment up front.</p>
          <div className="flash-badges">
            <span><Zap size={15} /> Flash search</span>
            <span><ShieldCheck size={15} /> Safer picks</span>
            <span><Clock3 size={15} /> Live timing</span>
          </div>
        </motion.div>

        <motion.div className="flash-card train-showcase" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 }}>
          <div className="showcase-header">
            <span>Cartoonic Vande Bharat</span>
            <b>SAFFRON EDITION</b>
          </div>
          <VandeBharatHero />
        </motion.div>
      </section>

      <section className="flash-grid" id="book" aria-label="Search trains">
        <form className="flash-card search-panel glossy-search" onSubmit={search}>
          <div className="card-title-row">
            <span>01</span>
            <h2>Search trains</h2>
          </div>
          <div className="station-pair">
            <StationAutocomplete label="From" value={from} onChange={setFrom} placeholder="Leaving from" />
            <button className="swap" type="button" onClick={() => { setFrom(to); setTo(from); }} aria-label="Swap stations">
              <ArrowLeftRight size={18} />
            </button>
            <StationAutocomplete label="To" value={to} onChange={setTo} placeholder="Going to" />
          </div>
          <label className="date-field">
            <span><CalendarDays size={16} /> Date of journey</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <button className="search-button" type="submit"><Search size={18} /> Find trains</button>
          {error && <p className="form-error">{error}</p>}
        </form>

        <aside className="flash-card stats-card">
          <span className="card-number">9K+</span>
          <b>Stations ready</b>
          <p>Pick from real station autocomplete and jump straight into train results.</p>
        </aside>
      </section>

      <section className="route-section" id="routes">
        <div className="route-heading flash-card">
          <p className="flash-kicker"><MapPin size={16} /> Multi-row cards</p>
          <h2>FLASH ROUTES</h2>
        </div>
        <div className="route-list multi-card-list">
          {routes.map((route, index) => (
            <button type="button" onClick={() => choose(route)} className="route-card glossy-route" key={`${route[0]}-${route[1]}`}>
              <span className="route-index">0{index + 1}</span>
              <span className="route-codes">{route[0]} <i /> {route[1]}</span>
              <span>{route[2]} <ArrowLeftRight size={13} /> {route[3]}</span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      </section>

      <section className="proof flash-proof" id="why">
        <div><Clock3 /><b>In real time</b><span>Availability that keeps up with you.</span></div>
        <div><Users /><b>Built for every traveller</b><span>Clear choices, from first search to ticket.</span></div>
        <div><MapPin /><b>India, connected</b><span>Your next station is always within reach.</span></div>
      </section>
      <footer>RailYatra is a portfolio project and is not affiliated with Indian Railways or IRCTC.</footer>
    </main>
  );
}
