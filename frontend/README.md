# AutoJobAgent Frontend

Production-level SaaS dashboard UI for an AI-powered job automation platform.

## Architecture
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS (Dark Theme by default)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Routing:** React Router DOM v7
- **Components:** Atomic component architecture with reusable UI elements.

## Folder Structure
- `src/components/layout`: Sidebar, Navbar, and Main Dashboard Layout.
- `src/components/ui`: Reusable primitive components (Buttons, Inputs, Modals).
- `src/pages/auth`: Authentication flows (Login, Signup).
- `src/pages/dashboard`: Core application features (Match Engine, Resume Parser, Cover Letter Gen).
- `src/lib`: Utility functions and helper libraries.

## Setup
1. `npm install`
2. `npm run dev`

## Key Features
- **AI Match Engine:** Visualizes job matches with AI insights and red flag detection.
- **Resume Parser:** Professional drag & drop interface with parsing progress and result preview.
- **Cover Letter Gen:** Tone-aware AI letter generation with live editing.
- **Premium Lock System:** UI-ready access control and upgrade CTAs.
- **Modern UI:** Glassmorphism, premium gradients, and micro-interactions.
