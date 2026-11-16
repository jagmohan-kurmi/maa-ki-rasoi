# Maa Ki Rasoi - Food & Tiffin Service Management System

Production-grade web portal and customer self-service platform for tiffin services, student mess operations, and community kitchens. Built with React 18, TypeScript, TailwindCSS, Vite, and Supabase.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)

---

## 🌟 Overview

**Maa Ki Rasoi** provides an end-to-end digital operations portal for food services, daily student mess dining, and subscription-based tiffin deliveries. It eliminates manual register book tracking, simplifies daily attendance and meals consumed, tracks subscription plan renewals, and handles customer grievances seamlessly.

### Key Implemented Features

1. **Public Dining & Menu Showcase**:
   - Dynamic daily menus with breakfast, lunch, and dinner meal compositions.
   - Subscription plans comparison (Daily, Monthly Student, Executive/Working Professional).
   - Customer feedback and rating system.

2. **Customer Self-Service Portal**:
   - Secure phone/OTP authentication.
   - Daily attendance ledger (meals consumed vs skipped).
   - Plan validity and expiration notifications.
   - Online meal pause/skip requests for students traveling home.
   - Direct grievance/complaint submission with real-time resolution status.

3. **Admin Operations Suite**:
   - Real-time operations dashboard with revenue metrics and active member counts.
   - Attendance management: single-tap marking for daily breakfast, lunch, and dinner.
   - Customer CRM: active subscriptions, renewal dates, balance ledgers, and contact directory.
   - Menu planner: weekly scheduled menus with nutritional highlights.
   - Expense tracker: kitchen grocery purchases, gas refills, and staff wages.
   - Reports generator: daily meal tallies and monthly profit/loss accounting.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend / Database**: Supabase (PostgreSQL, Row Level Security, Edge Functions).
- **State & Routing**: Client-side history routing with modular view controllers.
- **Security**: PostgreSQL Row Level Security (RLS) policies, input sanitation, typed schemas.

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Local Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jagmohan-kurmi/maa-ki-rasoi.git
   cd maa-ki-rasoi
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Supabase project credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🛡️ Auditing & Compliance Documentation

- [`PROJECT_AUDIT.md`](./PROJECT_AUDIT.md): Complete architecture breakdown and module inventory.
- [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md): OWASP Top 10 static security audit and RLS verification.
- [`CODEX_APPLICATION_READINESS.md`](./CODEX_APPLICATION_READINESS.md): Open-source readiness checklist.

---

## 🤝 Contributing

Contributions are welcomed! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and adhere to [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
