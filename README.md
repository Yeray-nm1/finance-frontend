# Finance Frontend

Modern finance management dashboard built with Next.js 15, React 19, TypeScript, and Tailwind CSS.

## Tech Stack
- **Framework**: Next.js 15
- **UI**: React 19, Radix UI primitives
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, Tailwind Animations
- **Utilities**: Lucide React (icons), next-themes (theming), PapaParse (CSV parsing)
- **Auth**: React Context-based authentication with protected routes

## Prerequisites
- Node.js 18.x+
- npm (or compatible package manager)

## Getting Started

### Installation
```bash
git clone <repository-url>
cd finance-frontend
npm install
```

### Environment Setup
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=<your-backend-api-endpoint>
```
Refer to `src/lib/api.ts` for API client configuration.

### Run Development Server
```bash
npm run dev
```
App runs on `http://localhost:3001` (configured in `package.json`).

## Available Scripts
| Script | Description |
|--------|-------------|
| `dev` | Start Next.js dev server on port 3001 |
| `build` | Create production build |
| `start` | Start production server |
| `lint` | Run Next.js ESLint checks |

## Project Structure
```
src/
├── app/                  # Next.js App Router pages & layouts
│   ├── (auth)/           # Login/Register pages
│   ├── dashboard/        # Dashboard layout & main view
│   ├── accounts/         # Account management
│   ├── transactions/     # Transaction tracking
│   ├── budgets/          # Budget management
│   ├── subscriptions/    # Subscription tracking
│   ├── categories/       # Category management
│   └── globals.css       # Global styles
├── components/           # Reusable components
│   ├── layout/           # Sidebar, AuthGuard
│   └── ui/               # Radix UI-based primitives (buttons, dialogs, etc.)
├── contexts/             # AuthContext for user state
├── lib/                  # API client, utility functions
├── types/                # TypeScript type definitions
└── middleware.ts         # Auth route protection
```

## Features
- 🔐 Authentication with protected routes
- 📊 Dashboard overview
- 💳 Account management
- 💸 Transaction tracking
- 📉 Budget planning
- 🔄 Subscription management
- 🏷️ Category organization
- 🌓 Light/Dark theme support
