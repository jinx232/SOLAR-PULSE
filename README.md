# ☀️ Solar Pulse — Intelligent Solar Sizing, ROI & Energy Management Platform

Solar Pulse is a complete, production-grade SaaS and planning platform designed for homeowners, technical solar engineers, energy consultants, and installers. It calculates load demands, sizes PV solar array capacity & battery banks, forecasts 25-year financial cashflows, optimizes panel tilt & compass orientation, and integrates full user authentication and payment processing.

---

## 🌟 Key Features

### 1. ⚡ Intelligent Consumption & Appliance Calculator
- Dynamic household appliance load ledger with real-time wattage and runtime configuration.
- Critical circuit tagging for emergency backup planning.
- **Global Sizing Zones**: Covers all world regions (Africa, Europe, Americas, Middle East, Asia, Oceania) with localized peak sun hours.
- Interactive **Grid Outage Simulator**: Simulates real-time battery drain rates during utility blackouts.
- Direct **Firebase Cloud Firestore** project persistence (auto-save and restore).

### 2. 💰 Financial Cost & 25-Year ROI Estimator
- Instant system size calculations (kW rating and 400W panel counts).
- Inflation-adjusted utility rate compounding vs. clean solar generation.
- Dynamic SVG 25-year cumulative cashflow comparison chart.
- Simple payback period window and lifetime wealth projections.
- One-click formatted summary clipboard export for customer quotes.

### 3. 🧭 Advanced Orientation & Tilt Slope Optimization
- Interactive SVG rooftop model with tilt slope and compass azimuth adjustments.
- Real-time **Geographic Capture Efficiency (%)** index.
- Comprehensive panel technology comparison (Monocrystalline vs Polycrystalline vs Thin Film).
- Live worldwide postal/zip code lookup with geographic coordinates.

### 4. 🤖 "Solara" Solar Intelligence Expert AI
- Built-in technical energy knowledge base covering net metering, battery chemistry (LiFePO4 vs AGM), inverter architectures, and maintenance schedules.
- Suggested prompt chips and conversational technical guidance.

### 5. 🛡️ SaaS Monetization, Authentication & Admin Dashboard
- **Authentication**: Firebase Auth (Email/Password registration and login).
- **Subscription Tiers**: Free, Pro ($19/mo or ₦25,000), and Installer ($49/mo or ₦65,000).
- **Payment Gateways**: Paystack and Flutterwave checkout integration.
- **Secure Cloud Webhooks**: Firebase Cloud Functions v2 with HMAC SHA512 signature verification.
- **Admin Workspace**: Real-time user presence tracking, paid subscriber metrics, and operational health monitoring.
- **PWA Ready**: Offline caching, service worker lifecycle management, and mobile installation.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# 1. Clone repository
git clone https://github.com/your-username/solar-pulse.git
cd solar-pulse

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
```

### Configure `.env`
Fill in your public client keys:
```env
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your_flutterwave_public_key
VITE_ADMIN_EMAIL=your_email@gmail.com
```

### Run Locally
```bash
# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## ☁️ Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Email/Password).
3. Enable **Cloud Firestore** and **Storage**.
4. Deploy the included Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Deploy Firebase Cloud Functions (for Paystack/Flutterwave webhooks):
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```
6. Deploy Hosting:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

## 🧪 Testing & Code Quality
```bash
# Run unit tests
npm test -- --run

# Build production bundle
npm run build
```

---

## 📄 License
Commercial License — Suitable for private SaaS deployment, client projects, and white-label distribution.
