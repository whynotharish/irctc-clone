# Saarthi — IRCTC Clone Frontend

Modern, motion-driven booking UI for the IRCTC clone project.

## Stack
- React + Vite
- Tailwind CSS v4
- Framer Motion (page transitions, seat grid stagger, hero animation)
- React Router

## Design system
See the design plan in project notes: deep signal-blue (`#16233F`) +
warm marigold accent (`#F2994A`), Space Grotesk (display) + Inter (body)
+ IBM Plex Mono (PNR/seat numbers). Signature element: the animated
"journey line" (`src/components/JourneyLine.jsx`) — a route line with
a train marker that animates along it, reused across the hero, seat
selection, and payment steps to visually thread the booking flow together.

## Pages
- `/` — Home, search form, hero journey-line
- `/search` — Train results for a route/date
- `/trains/:id/seats` — Seat grid with live lock countdown (ties to backend Redis lock)
- `/trains/:id/passengers` — Passenger details + mock payment
- `/bookings/:pnr` — Confirmation screen with PNR

## Setup

```bash
npm install
npm run dev
```

The dev server proxies `/api/*` to `http://localhost:4000` (the backend).
Make sure the backend (see ../server) is running with Postgres + Redis first.

## Accessibility notes
- All interactive elements have visible keyboard focus states
- Reduced-motion preference is respected (animations disable via media query)
- Seat buttons use `aria-pressed` / `aria-label` for screen readers
- Font sizes and contrast tuned to be legible for older users, not just modern/trendy
