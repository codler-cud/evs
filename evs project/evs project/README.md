# EcoSort — Waste Segregation & Recycling Awareness Platform

> **“Sort Smart. Recycle Right. Protect Our Environment.”**

EcoSort is a mobile-first responsive web application built for an Environmental Science project. It helps users identify household waste items, understand how to segregate them into the right bin, follow proper disposal or recycling instructions, locate nearby collection centres on an interactive map, and track responsible waste-disposal habits.

---

## 1. Environmental Problem Statement

At the household and campus level, recoverable resources frequently end up in landfills because people are unsure:
- Which bin or category an item belongs to (Wet/Organic, Dry/Recyclable, E-Waste, or Hazardous)
- Whether a soiled or multi-material item is recyclable
- How to safely dispose of e-waste, batteries, and expired medicines
- Where nearby authorized recycling or e-waste drop-off centres are located

When wet waste mixes with dry paper/plastic at the source, contamination lowers recyclability, while improper e-waste or hazardous disposal introduces toxic heavy metals and fire risks.

## 2. Proposed Solution

EcoSort provides an accessible, centralized decision-support flow at the moment of disposal:

```text
Waste Item → Identify / AI Scan → Categorize → Right Bin → Disposal Instructions → Collection Centre → Log Action & Eco Score
```

### Core Features
- **Environmental Landing Page**: Explains the problem, core workflow, 4 waste categories, and benefits.
- **Waste Search & Identification ("What Should I Do With My Waste?")**: Searchable database of waste items with category badges, bin recommendations, numbered preparation steps, and 3R environmental tips.
- **AI-Assisted Image Classification ("Scan Waste")**: Modular Python CV prototype analyzing HSV color, brightness, edge density, and specular reflections, returning top category probabilities + database disposal guidance + a manual confirmation fallback when confidence is low.
- **Collection Centre Locator ("Find a Collection Centre")**: Interactive OpenStreetMap + Leaflet map with material filters (`E-waste`, `Plastic`, `Paper`, `Glass`, `Metal`, `General recycling`, `Hazardous`), **View on Map**, and **Get Directions**.
- **Personal Disposal Tracker & Eco Score**: Authenticated users can log disposals, view history, earn transparent Eco Score points, and progress through Eco Levels.
- **Waste Segregation Challenges**: Includes a 7-Day Segregation Challenge with interactive Day 1–7 tracking and goal-based challenges.
- **Awareness & 3R Hub**: Dedicated **Reduce, Reuse, Recycle (3R)** section connected to EcoSort actions plus concise student-friendly guides.
- **Admin Dashboard**: Protected console with analytics charts (Recharts) and full CRUD for waste items, collection centres, users, awareness articles, and challenges.

---

## 3. Technology Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 19, Vite, React Router, Tailwind CSS v4, Lucide Icons, Leaflet (`react-leaflet`), Recharts |
| **Backend** | Python 3.13, FastAPI, Uvicorn, Pydantic v2 |
| **Database & ORM** | SQLAlchemy 2.0, SQLite (default for demo), PostgreSQL-ready via `DATABASE_URL`, Alembic |
| **Security** | `bcrypt` password hashing, `PyJWT` Bearer authentication, role-based access control, upload validation |
| **AI Service** | Modular `BaseWasteClassifier` interface with `CVPrototypeWasteClassifier` (Pillow + NumPy) |

---

## 4. Project Structure

```text
EcoSort/
├── .env.example
├── docker-compose.yml
├── README.md
├── backend/
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   ├── init_db.py
│   ├── tests/
│   │   └── test_api.py
│   └── app/
│       ├── main.py
│       ├── core/          # config.py, security.py
│       ├── database/      # session.py, seed.py
│       ├── models/        # user.py, waste.py, centre.py, activity.py, challenge.py, awareness.py
│       ├── schemas/       # Pydantic v2 schemas
│       ├── routes/        # auth, waste, centres, records, challenges, awareness, admin
│       ├── services/      # eco_score.py
│       └── ai/            # base.py, cv_classifier.py, service.py
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── public/
    │   ├── manifest.webmanifest
    │   ├── ecosort-icon.svg
    │   └── samples/       # Built-in demo waste photos for Scan Waste
    └── src/
        ├── App.jsx
        ├── components/    # Layout, CategoryBadge, WasteItemDetailCard, ProtectedRoute
        ├── hooks/         # useAuth.jsx
        ├── services/      # api.js
        └── pages/         # Landing, Auth, Identify, Scan, Centres, Dashboard, Activity, Challenges, Learn, Profile, Admin
```

---

## 5. Database Schema Overview

Relational SQLAlchemy tables (`backend/app/models/`):
1. `users`: `id`, `name`, `email` (unique), `password_hash`, `role` (`user`/`admin`), `is_active`, `eco_score`, `location`, timestamps.
2. `waste_categories`: `id`, `name`, `slug`, `bin_color`, `bin_label`, `description`, `examples`, `icon_name`.
3. `disposal_methods`: `id`, `name`, `slug`, `category_id` (FK), `summary`, `default_steps`.
4. `waste_items`: `id`, `name`, `keywords`, `description`, `category_id` (FK), `disposal_method_id` (FK), `bin_type`, `recyclable`, `disposal_method_text`, `instructions`, `environmental_tip`, `search_count`, timestamps.
5. `collection_centres`: `id`, `name`, `address`, `city`, `waste_types`, `contact_phone`, `contact_email`, `operating_hours`, `latitude`, `longitude`, `is_active`.
6. `waste_records`: `id`, `user_id` (FK), `waste_item_id` (FK), `item_name`, `category_id` (FK), `action_type`, `quantity`, `points_earned`, `notes`, `disposed_date`.
7. `challenges` & `challenge_progress`: Challenge metadata and per-user step/day progress with unique `(user_id, challenge_id)` constraint.
8. `awareness_articles`: `id`, `title`, `slug`, `summary`, `content`, `category_tag`, `reading_time_mins`, `is_featured`.

---

## 6. REST API Endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Health check |
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login and obtain JWT |
| `GET` / `PUT` | `/api/auth/me` | User | Get or update current profile |
| `GET` | `/api/waste/categories` | Public | List the 4 waste categories |
| `GET` | `/api/waste?q=&category=` | Public | Search waste items |
| `GET` | `/api/waste/{id}` | Public | Get item details & instructions |
| `POST` | `/api/waste/classify` | Public | Classify uploaded waste image |
| `GET` | `/api/collection-centres` | Public | Filter centres by waste type or query |
| `GET` | `/api/dashboard` | User | User stats, Eco Score, recent records |
| `GET` / `POST` | `/api/waste-records` | User | List or log disposal records |
| `DELETE` | `/api/waste-records/{id}` | User | Delete own record & recompute score |
| `GET` | `/api/challenges` | Optional | List challenges + user progress |
| `POST` | `/api/challenges/{id}/join` | User | Join a challenge |
| `POST` | `/api/challenges/{id}/progress` | User | Mark day/step complete |
| `GET` | `/api/awareness` | Public | List educational articles |
| `GET` | `/api/admin/analytics` | Admin | KPIs & chart series |
| `GET` / `PATCH` | `/api/admin/users...` | Admin | Manage user accounts |
| `POST` / `PUT` / `DELETE` | `/api/admin/waste...` | Admin | Manage waste items |
| `POST` / `PUT` / `DELETE` | `/api/admin/collection-centres...` | Admin | Manage collection centres |
| `POST` / `DELETE` | `/api/admin/awareness`, `/api/admin/challenges` | Admin | Manage articles & challenges |

---

## 7. Local Setup & Running Instructions

### Prerequisites
- Python 3.11+ (tested on Python 3.13.5)
- Node.js 20+ and npm

### Step 1: Configure Environment
Copy `.env.example` to `backend/.env` if you want custom settings (defaults work out of the box for local demo):
```powershell
copy .env.example backend\.env
```

### Step 2: Run the Backend (FastAPI)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python init_db.py
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`
- Run backend automated tests:
```powershell
.\.venv\Scripts\python.exe -m pytest tests\test_api.py -v
```

### Step 3: Run the Frontend (React + Vite)
Open a second terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 8. Demo Credentials (Development / Classroom Demo Only)

> Set `SEED_DEMO_DATA=false` in `.env` before deploying to production.

- **Student Demo Account**
  - Email: `student@ecosort.demo`
  - Password: `EcoSort@123`
- **Admin Evaluator Account**
  - Email: `admin@ecosort.demo`
  - Password: `AdminEco@123`

---

## 9. AI Functionality & Modularity

The Scan Waste pipeline follows:
`Frontend Upload → FastAPI (/api/waste/classify) → BaseWasteClassifier → Waste Database → Disposal Recommendation`

- `CVPrototypeWasteClassifier` (`backend/app/ai/cv_classifier.py`) extracts real pixel-level features (HSV hue ratios, luminance, center saturation, specular highlights, and Sobel-like edge density) to compute softmax probabilities across the 4 categories.
- When confidence is below `AI_CONFIDENCE_THRESHOLD` (default `0.62`), the API sets `needs_manual_confirmation = true` and the UI guides the user to confirm or override the category/item manually.
- To upgrade to a trained CNN/MobileNet/YOLO model later, implement `BaseWasteClassifier.classify()` in `backend/app/ai/` and swap it in `get_classifier()`.

---

## 10. Project Limitations & Future Scope

### Limitations
- **AI Accuracy**: The built-in computer-vision prototype relies on visual color/texture heuristics rather than a large labeled waste dataset; low-confidence fallback is included intentionally.
- **Centre Data**: Collection centre locations and hours are stored in the project database for demonstration rather than pulled from live municipal feeds.
- **Estimated Impact**: Eco Score points reflect responsible habit assumptions, not exact scientific carbon-offset measurements.
- **Software Scope**: EcoSort assists with segregation decisions and awareness; actual recycling requires physical participation and municipal/recycler infrastructure.

### Future Enhancements
- Fine-tuned deep learning waste classification model (e.g., MobileNetV3 trained on TrashNet/TACO)
- Multilingual interface and municipal pickup schedules
- QR-code verification at campus smart bins
- Community leaderboards and doorstep e-waste pickup requests
