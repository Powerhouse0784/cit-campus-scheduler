# Third-Party Libraries, Assets and Tools

This document lists all third-party dependencies, open-source packages, external APIs, and design assets used in the CIT Campus Scheduler application.

---

## 1. Runtime & Production Dependencies

| Package Name | Declared Version | License | Purpose / Role |
|---|---|---|---|
| **next** | `14.2.15` | MIT | Full-stack framework, App Router, React Server Components, and Edge/Node API route handlers |
| **react** | `^18.3.1` | MIT | Core UI library for component hierarchy and DOM management |
| **react-dom** | `^18.3.1` | MIT | React DOM renderer for browser environments |
| **framer-motion** | `^11.11.9` | MIT | Motion system, layout transitions, modal animations, and route progress bar |
| **lucide-react** | `^0.453.0` | ISC | Accessible SVG iconography across navigation, badges, and controls |
| **clsx** | `^2.1.1` | MIT | Conditional CSS class merging utility |
| **tailwind-merge** | `^2.5.4` | MIT | Utility for resolving Tailwind CSS class conflicts safely |

---

## 2. Development & Build Tools

| Package Name | Declared Version | License | Purpose / Role |
|---|---|---|---|
| **typescript** | `^5` | Apache-2.0 | Static type checking and interface verification |
| **tailwindcss** | `^3.4.1` | MIT | Utility-first CSS generation engine |
| **postcss** | `^8` | MIT | Tool for transforming CSS with Tailwind plugins |
| **eslint** | `^8.57.0` | MIT | JavaScript and TypeScript static code analysis |
| **eslint-config-next** | `14.2.15` | MIT | Next.js-specific linting rules and optimizations |
| **@types/node** | `^20` | MIT | TypeScript type definitions for Node.js runtime APIs |
| **@types/react** | `^18` | MIT | TypeScript type definitions for React |
| **@types/react-dom** | `^18` | MIT | TypeScript type definitions for React DOM |

---

## 3. External Cloud APIs & Services

| Provider | Service / Model | Integration Method | Purpose |
|---|---|---|---|
| **Groq Cloud** | `llama-3.3-70b-versatile` | REST API (`https://api.groq.com/openai/v1/chat/completions`) | Natural-language and Hinglish intent parsing for venue booking requests |
| **Supabase** | PostgreSQL 15 | PostgREST API / RPC | Optional persistent storage for atomic booking transitions and schedule revisions |

*Note: The application includes offline rule-based fallbacks for both Groq and Supabase.*

---

## 4. Fonts and Media Assets

- **Google Fonts**:
  - *Plus Jakarta Sans* (Body copy) — Open Font License (OFL)
  - *Manrope* (Headings & numerical displays) — Open Font License (OFL)
  - *Fraunces* (Serif accents) — Open Font License (OFL)
- **Vector Artwork**:
  - CIT Logo & Book Mark: Custom hand-crafted inline SVGs (`components/CitLogo.tsx`).
  - Campus Sketch & Skyline: Custom inline SVGs (`components/Sidebar.tsx`).
  - Robot Assistant Avatar: Custom inline SVGs (`components/AiAssistantModule.tsx`).
- **Campus & Event Imagery**:
  - Campus hero images (`public/images/hero-campus-light.jpg`, `public/images/hero-campus-dark.jpg`) and festival cards (`public/images/spectra/*.jpg`) were custom-rendered for this project under creative commons attribution.

---

## 5. Official Validator

- **Script**: `validator.py`
- **Source**: Provided in the hackathon starter pack.
- **License**: Competition evaluation software; uses the Python standard library with no external pip dependencies.