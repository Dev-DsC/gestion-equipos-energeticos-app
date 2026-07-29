# Energy Management System — Transport & Rental Optimization

A TypeScript-based single-page application for managing energy equipment rental contracts, fleet logistics, and transport load optimization. The system applies a **0/1 Knapsack dynamic programming algorithm** to maximize total power output (kW) under real-world weight and volume constraints.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Core Modules](#core-modules)
  - [Type System (`types.ts`)](#type-system-typests)
  - [Contracts (`contratos.ts`)](#contracts-contratosts)
  - [Optimization Engine (`optimizacion.ts`)](#optimization-engine-optimizacionts)
  - [Application Shell (`main.ts`)](#application-shell-maints)
- [Features](#features)
- [Algorithm — 0/1 Knapsack with Memoization](#algorithm--01-knapsack-with-memoization)
- [Getting Started](#getting-started)
- [Build & Deployment](#build--deployment)

---

## Overview

This system solves a real-world logistical problem: **selecting the optimal subset of energy equipment (generators, UPS units, transformers, battery banks) to load onto a transport vehicle** such that:

- Total weight does not exceed the vehicle's payload capacity.
- Total volume does not exceed the vehicle's cargo volume.
- **Total power output (kW) is maximized.**

Users can either create contracts **manually** by selecting equipment from a catalog, or let the **optimization engine** compute the best load automatically. Each contract generates an itemized invoice and updates the equipment inventory state.

---

## Tech Stack

| Layer            | Technology                                          |
| ---------------- | --------------------------------------------------- |
| **Language**     | TypeScript 6.0 (strict mode, ES2023 target)         |
| **Build Tool**   | Vite 8.x                                            |
| **Runtime**      | Browser (vanilla DOM API, no framework)             |
| **Module System**| ESM (`type: module`, `verbatimModuleSyntax`)        |
| **Styling**      | CSS with light/dark `prefers-color-scheme` support  |

**Key design decisions:**
- **Zero external runtime dependencies** — all logic is hand-rolled TypeScript.
- **TypeScript strict mode** enabled (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) for maximum type safety.
- **No framework** — the UI is built with plain DOM manipulation, keeping the bundle minimal and the architecture transparent.

---

## Project Structure

```
gestion-energetica/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   │   ├── hero.png
│   │   ├── typescript.svg
│   │   └── vite.svg
│   ├── contratos.ts          # Contract model & business rules
│   ├── main.ts               # UI shell, event wiring, rendering
│   ├── optimizacion.ts       # Knapsack algorithm & invoice generation
│   ├── style.css             # Global styles (light/dark themes)
│   └── types.ts              # Domain types & interfaces
├── index.html                # Vite entry point
├── package.json
├── tsconfig.json
└── vite.config.ts            # (implicit, Vite default)
```

---

## Core Modules

### Type System (`types.ts`)

Defines the domain model with union types and interfaces:

- **`Equipo`** (Equipment): ID, name, type, weight (kg), volume (m³), power (kW), daily rental cost, and availability state (`Disponible | Reservado | Alquilado`).
- **`Vehiculo`** (Vehicle): ID, license plate, weight/volume capacities, type (`Camión | Furgón | Plataforma`), and operational state.
- **`TipoEquipo`**: `Generador | UPS | Transformador | Banco de baterías`.

### Contracts (`contratos.ts`)

Manages the **`Contrato`** entity and enforces business rules:

- A contract links a client, a vehicle, equipment, and project location with start/end dates.
- `agregarEquipoAContrato()` validates equipment availability and transitions its state to `Reservado`, preventing double-booking.

### Optimization Engine (`optimizacion.ts`)

Contains two core functions:

- **`optimizarTransporte()`** — 0/1 Knapsack DP with memoization. Given a pool of available equipment and a vehicle's weight/volume limits, it returns the optimal subset that **maximizes total kW**.
- **`generarFactura()`** — Creates a `Factura` (invoice) with total equipment count, total power, and total cost based on daily rental rates × rental period.

### Application Shell (`main.ts`)

The single-page UI is built entirely via vanilla DOM APIs:

- Renders an equipment catalog with selectable checkboxes.
- Provides two contract creation paths:
  1. **Manual** — user selects equipment and a vehicle.
  2. **Automatic** — the Knapsack algorithm computes the optimal load.
- Displays a **vehicle load card** with progress bars for weight and volume utilization.
- Shows a detailed **invoice panel** with per-equipment cost breakdown.
- Maintains a **real-time operation log** (history of system events with color-coded severity).

---

## Features

| Feature                          | Description                                                        |
| -------------------------------- | ------------------------------------------------------------------ |
| **Equipment Catalog**            | Tabular view of all equipment with availability-status highlighting |
| **Manual Contracting**           | Select equipment via checkboxes, assign a vehicle, create contract |
| **Capacity Validation**          | Rejects contracts where weight or volume exceeds vehicle limits    |
| **Automatic Optimization**       | Runs 0/1 Knapsack DP to maximize power (kW) under constraints      |
| **Vehicle Load Visualization**   | Progress bars showing weight and volume utilization percentages    |
| **Invoice Generation**           | Itemized invoice with per-equipment daily cost and total           |
| **Operation Log**                | Color-coded real-time event history                                |
| **Light / Dark Theme**           | Automatic theme switching via CSS `prefers-color-scheme`           |

---

## Algorithm — 0/1 Knapsack with Memoization

The transport optimization problem is modeled as a **multi-dimensional 0/1 Knapsack**:

- **Items:** Available equipment.
- **Knapsack capacity:** Vehicle weight limit (kg) and volume limit (m³).
- **Value to maximize:** Power output (kW).
- **Constraint:** Each item can be selected at most once (0/1).

The implementation uses **recursive DP with memoization**:

```typescript
const knapsack = (index, weight, volume) => {
  if (index === n) return { maxPotencia: 0, seleccionados: [] };
  const key = `${index}-${weight}-${volume}`;
  if (memo[key]) return memo[key];
  // Branch 1: exclude item
  // Branch 2: include item (if capacities allow)
  memo[key] = betterOf(branch1, branch2);
  return memo[key];
};
```

- **Time complexity:** O(n × W × V) where W and V are the discretized capacity dimensions.
- **Space complexity:** O(n × W × V) for the memoization cache.

A volume scaling factor (`×10`) is used to handle decimal volumes (e.g., 3.5 m³ → 35) without floating-point issues in the DP table keys.

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- npm ≥ 9

### Install & Run

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173` by default (Vite's standard port).

### Build for Production

```bash
npm run build
```

Output is written to `dist/`.

### Preview Production Build

```bash
npm run preview
```

---

## Build & Deployment

The project uses **Vite** with TypeScript transpilation (`tsc` before build):

| Command         | Description                                  |
| --------------- | -------------------------------------------- |
| `npm run dev`   | Start Vite dev server with HMR               |
| `npm run build` | Run `tsc` for type-checking, then Vite build |
| `npm run preview`| Serve the production build locally           |

The output is a fully static SPA (HTML + CSS + JS) deployable to any static hosting (Netlify, Vercel, GitHub Pages, S3, etc.).

---

## License

This project is provided for demonstration purposes.
