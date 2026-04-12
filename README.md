<div align="center">
<img src="./public/images/avatar.png" alt="logo" width="150" height="150" border-radius="50%" />
  
# maps.bayfield.dev
The world, seen through places I've visited ッ

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-5-blue?logo=maplibre)](https://maplibre.org)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue)](LICENSE)

</div>

# 📖 • Summary

- [🚀 • Presentation](#--presentation)
- [✨ • Features](#--features)
- [🛠️ • Tech Stack](#️--tech-stack)
- [⚙️ • Getting Started](#️--getting-started)
- [🔑 • Environment Variables](#--environment-variables)
- [📁 • Project Structure](#--project-structure)
- [📃 • Credits](#--credits)
- [📝 • License](#--license)

# 🚀 • Presentation

This repository contains the source code for my personal map website, [maps.bayfield.dev](https://maps.bayfield.dev). The website showcases the places I've visited around the world using interactive maps and geolocation data.

Each marker on the map represents a real location I've been to, categorised by type — monuments, museums, parks, restaurants, and more. The map supports clustering, full-text search, dark mode, and multiple languages.

# ✨ • Features

- 🗺️ **Interactive map** — powered by MapLibre GL with smooth panning, zooming, and a globe projection
- 📍 **Custom SVG markers** — each location type has its own icon (monuments, museums, parks, restaurants, etc.)
- 🔵 **Marker clustering** — nearby markers group into clusters that expand on click
- 🔍 **Geocoding search** — search for any place in the world via a self-hosted Photon instance
- 🌓 **Dark / light mode** — automatic map tile switching (Carto Positron / Dark Matter)
- 🌍 **Internationalisation** — multi-language support via `next-intl`
- 🔐 **Authentication** — NextAuth-powered login; admin users can add new markers by clicking the map
- 🗂️ **Marker filtering** — filter visible markers by type through the dropdown menu
- 🗄️ **SQLite persistence** — all markers are stored in a local SQLite database via `better-sqlite3`

# 🛠️ • Tech Stack

| Category | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) |
| Map | [MapLibre GL JS](https://maplibre.org) via [mapcn](https://mapcn.dev) |
| UI components | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://radix-ui.com) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Auth | [NextAuth.js](https://next-auth.js.org) |
| Database | [SQLite](https://sqlite.org) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Geocoding | Self-hosted [Photon](https://photon.komoot.io) |
| i18n | [next-intl](https://next-intl-docs.vercel.app) |
| Icons | [Lucide React](https://lucide.dev) |

# ⚙️ • Getting Started

**Prerequisites:** Node.js 20+, npm

```bash
# 1. Clone the repository
git clone https://github.com/PaulBayfield/maps.bayfield.dev.git
cd maps.bayfield.dev

# 2. Install dependencies
npm install

# 3. Copy the environment file and fill in your values
cp .env.example .env.local

# 4. Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

# 🔑 • Environment Variables

| Variable | Description |
|---|---|
| `NEXTAUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Random secret used to sign session tokens |
| `NEXT_PUBLIC_APP_ADMIN_EMAIL` | Email address that gets admin rights to add markers |

# 📁 • Project Structure

```
maps.bayfield.dev/
├── data/
│   └── markers.db              # SQLite database
├── public/
│   └── map/                    # SVG marker icons (one per type)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── markers/        # GET / POST marker endpoints
│   │   │   └── search/         # Geocoding proxy endpoint
│   │   └── [locale]/           # Locale-aware pages
│   ├── components/
│   │   ├── map.tsx             # Main map component
│   │   ├── searchbar.tsx       # Search + temp marker
│   │   └── ui/                 # shadcn/ui components
│   └── i18n/                   # Translation files
└── ...
```

# 📃 • Credits

- [Paul Bayfield](https://github.com/PaulBayfield)

# 📝 • License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
