

---

## 📖 Overview

**GreenTrace** is a comprehensive, real-time carbon emissions tracking, management, and reduction platform. Built for both individuals and large enterprises, GreenTrace moves beyond generic calculators to provide **GPS-verified, real-world data** tracking for environmental impact. It empowers organizations to monitor emissions across departments, generate audit-ready ESG reports, and foster a culture of sustainability through gamification and AI-driven insights.

---

## 🌟 Core Features

### 🏢 Enterprise & Organizational Intelligence
- **Organization View**: Analyze aggregated emissions data across your entire organization. Switch seamlessly between "My View" and "Org View".
- **Department Challenges & Leaderboards**: Foster friendly competition between departments with real-time Green Score rankings to drive sustainable habits.
- **Audit-Ready ESG Reporting**: Generate comprehensive Environmental, Social, and Governance (ESG) PDF reports with GPS-verified data and hash verification for compliance and stakeholder sharing.
- **Waste Realization**: Track carbon inefficiency in actual currency (₹) based on GPS and utility logs.
- **Smart Grid Monitor**: Real-time integration with Indian grid intensity data (CEA/POSOCO) to monitor the true cost of electricity consumption.
- **Audit Trail & Privacy**: Built-in data integrity checks with a live activity feed and robust privacy toggles.

### 👤 Individual Tracking & Engagement
- **Green Dashboard**: A personalized hub showing your carbon gauge, stats cards, and recent activities.
- **Invisible Logger (AutoTracker)**: Frictionless tracking using live GPS and reverse geocoding, cloud-synced every 10 seconds.
- **QR Check-in**: Instant commute logging via scannable QR codes for office or site check-ins.
- **Activity Logger**: Manually log specific activities, commutes, and energy consumption with precise impact calculations.
- **Eco Marketplace**: Discover and shop sustainable products for a greener lifestyle.
- **Carbon Offsets**: Invest in verified carbon offset projects directly from the platform to neutralize your footprint.

### 🤖 AI & Advanced Analytics
- **Predictive Analytics**: Utilizes linear regression on actual logs combined with AI deep analysis to forecast future carbon emissions.
- **Carbon Heatmap & Emissions Chart**: Visualize emission patterns over time to identify high-impact areas and trends.

---

## 🛠 Tech Stack

GreenTrace is built on a modern, highly scalable, and performant tech stack:

### Frontend
- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/) for blazing-fast development and optimized builds.
- **Routing**: [React Router v6](https://reactrouter.com/)
- **State Management**: [TanStack React Query v5](https://tanstack.com/query/latest) for robust server-state management and caching.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible, and customizable components.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth, fluid UI transitions.
- **Mapping**: [Leaflet](https://leafletjs.com/) & [React Leaflet](https://react-leaflet.js.org/) for GPS and heatmap visualizations.
- **Charting**: [Recharts](https://recharts.org/) for responsive, declarative data charts.

### Backend & Database (BaaS)
- **Platform**: [Supabase](https://supabase.com/)
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth (Email/Password, OAuth)
- **Realtime**: Supabase Realtime for live activity feeds and instant updates.
- **Edge Functions**: Used for complex calculations and integrations.

---

## 📁 Project Structure

```text
GreenTrace/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components & Feature modules
│   │   ├── ui/             # shadcn/ui base components
│   │   ├── AutoTracker.tsx # Invisible GPS logger
│   │   ├── ESGReport.tsx   # PDF generation logic
│   │   ├── PredictiveAI.tsx# AI & Linear regression views
│   │   └── ...
│   ├── contexts/           # React Context providers (e.g., AuthContext)
│   ├── hooks/              # Custom React hooks (e.g., useActivities)
│   ├── integrations/       # Third-party integrations (Supabase client)
│   ├── lib/                # Utility functions, helpers, carbon calculators
│   ├── pages/              # Main route components (Index, Auth, NotFound)
│   ├── App.tsx             # Root component & Route definitions
│   └── main.tsx            # Application entry point
├── supabase/               # Supabase configuration, migrations, and edge functions
├── .env                    # Environment variables (not committed)
├── package.json            # Dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
└── vite.config.ts          # Vite bundler configuration
```

---

## 🚀 Getting Started

Follow these instructions to set up the project locally for development and testing.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or [Bun](https://bun.sh/) (Bun lockfile is present in the repo)
- A [Supabase](https://supabase.com/) account for backend services.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd GreenTrace-main
```

### 2. Install Dependencies
```bash
npm install
# or if using bun:
# bun install
```

### 3. Environment Configuration
Create a `.env` file in the root of your project. You will need to extract your Supabase URL and Anon Key from your Supabase project dashboard.

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-super-secret-anon-key
```

### 4. Database Setup (Supabase)
GreenTrace relies on specific PostgreSQL tables to function. Ensure your Supabase database has the following core tables set up:
- `profiles`: User profiles and green goals.
- `activities`: Logged carbon activities, including impact, category, and user references.
- `departments`: Organizational departments.
- `department_members`: Mapping of users to departments.
*(Note: Run your Supabase migrations or execute the provided SQL schemas if available in the `/supabase` directory).*

### 5. Run the Development Server
```bash
npm run dev
# or
# bun run dev
```
Navigate to `http://localhost:8080` (or the port specified in your terminal) to view the application.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the local Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Compiles the TypeScript code and builds the production bundle via Vite. |
| `npm run preview` | Starts a local web server that serves the built production bundle for testing. |
| `npm run lint` | Runs ESLint to identify and report on patterns found in ECMAScript/JavaScript code. |
| `npm run test` | Runs the Vitest testing suite. |
| `npm run test:watch` | Runs Vitest in watch mode for active development. |

---

## 🤝 Editing & Contributing

If you want to work locally using your own IDE, simply pull the latest changes, create a new branch for your feature, and submit a pull request once complete. 

Changes made via the [Lovable](https://lovable.dev/) visual editor will be committed automatically to this repository and synchronized with your local environment when you pull.

---

<div align="center">
  <p>Built for a greener tomorrow. 🌍</p>
</div>
