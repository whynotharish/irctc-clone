-- ============================================================
-- IRCTC Clone — Core Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stations (
    code TEXT PRIMARY KEY,          -- e.g. 'NDLS'
    name TEXT NOT NULL,
    city TEXT
);

CREATE TABLE IF NOT EXISTS trains (
    id SERIAL PRIMARY KEY,
    number TEXT UNIQUE NOT NULL,    -- e.g. '12301'
    name TEXT NOT NULL,
    source_code TEXT REFERENCES stations(code),
    destination_code TEXT REFERENCES stations(code),
    runs_on TEXT[] NOT NULL         -- ['MON','WED','FRI'] etc.
);

-- Intermediate stops (used for search + duration calc)
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    train_id INT REFERENCES trains(id) ON DELETE CASCADE,
    station_code TEXT REFERENCES stations(code),
    sequence INT NOT NULL,
    arrival_offset_min INT,   -- minutes from train's departure
    departure_offset_min INT,
    distance_km INT
);

CREATE TABLE IF NOT EXISTS coaches (
    id SERIAL PRIMARY KEY,
    train_id INT REFERENCES trains(id) ON DELETE CASCADE,
    class_type TEXT NOT NULL,       -- SL, 3A, 2A, 1A, CC, etc.
    coach_code TEXT NOT NULL,       -- S1, B2, A1...
    total_seats INT NOT NULL
);

-- One row per seat PER RUN DATE (so availability resets each day/run)
CREATE TABLE IF NOT EXISTS seat_inventory (
    id BIGSERIAL PRIMARY KEY,
    coach_id INT REFERENCES coaches(id) ON DELETE CASCADE,
    seat_number INT NOT NULL,
    run_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'available', -- available | locked | booked
    version INT NOT NULL DEFAULT 0,           -- optimistic-lock fallback
    UNIQUE(coach_id, seat_number, run_date)
);

CREATE INDEX IF NOT EXISTS idx_seat_inventory_lookup
    ON seat_inventory(coach_id, run_date, status);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pnr TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    train_id INT REFERENCES trains(id),
    run_date DATE NOT NULL,
    class_type TEXT NOT NULL,
    quota TEXT NOT NULL DEFAULT 'GENERAL', -- GENERAL | TATKAL
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | CONFIRMED | WAITLISTED | CANCELLED
    total_fare NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Note: seat_inventory_id is nullable — a WAITLISTED booking has
-- passenger rows with no seat assigned yet until promoteNextInQueue()
-- assigns one on cancellation elsewhere in the train.
CREATE TABLE IF NOT EXISTS booking_seats (
    id BIGSERIAL PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    seat_inventory_id BIGINT REFERENCES seat_inventory(id),
    passenger_name TEXT,
    passenger_age INT,
    passenger_gender TEXT,
    UNIQUE (booking_id, seat_inventory_id)
);

-- Waitlist queue per train/date/class (FIFO)
CREATE TABLE IF NOT EXISTS waitlist (
    id BIGSERIAL PRIMARY KEY,
    train_id INT REFERENCES trains(id),
    run_date DATE NOT NULL,
    class_type TEXT NOT NULL,
    booking_id UUID REFERENCES bookings(id),
    position INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
