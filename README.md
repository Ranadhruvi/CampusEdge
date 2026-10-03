# 🎓 CampusEdge - University Placement & Technical Preparation Suite

[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791.svg)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)

**CampusEdge** is an intelligent, full-stack campus placement preparation platform designed to help university students crack campus recruitment screening, technical assessments, coding rounds, and HR interviews.

---

## 🌟 Key Features

### 💻 1. Live Multi-Language Coding Arena
- In-browser code editor with real runtime execution for **Python**, **JavaScript**, **Java**, and **C++**.
- Sandboxed Python execution with strict memory & CPU limits and timeout protection.
- "Logic-First" whiteboard drafting for algorithmic formulation before coding.
- Dynamic test cases, hidden validation cases, and progressive hints.

### 📝 2. Proctored Corporate Mock Test Arena
- 2,050+ authentic placement questions across 17 engineering domains.
- Timed assessments (5-min sprint, 10-min standard, 20-min in-depth, 50-min marathon).
- Adaptive difficulty selection: Fundamental (Easy), Core Technical (Medium), and Advanced (Hard).
- Real-time tab-switch proctoring and fullscreen monitoring to prevent examination malpractice.

### ⚡ 3. Self-Paced Practice Drilling
- Instant answer feedback, detailed step-by-step explanations, and concept study mode.
- Flashcard mode for rapid revision.
- Zero-repeat question queue tracking.

### 📄 4. ATS Resume Compatibility Scanner
- Upload PDF resumes to analyze keyword match scores against real recruiter job descriptions.
- Highlights missing industry competencies, action verbs, and formatting errors.
- Tailored role targeting (Full Stack, Backend, Data Engineer, DevOps, etc.).

### 🎙️ 5. AI Voice HR & Technical Interview Simulator
- Live speech-to-text interactive interviews with webcam and audio recording.
- Instant AI evaluation of problem-solving structure, communication clarity, and technical depth.
- Comprehensive end-of-interview feedback scorecards.

### 🏢 6. Campus Drives & Company Eligibility Checker
- Active recruitment circulars with deadline trackers and proof of registration uploads.
- Automated eligibility verification for 25+ top MNCs (TCS, Infosys, Amazon, Microsoft, Wipro, Accenture, Google, etc.).
- Branch cutoffs, 10th/12th/CGPA criteria checking, and active backlog rules.

### 📈 7. Growth Analytics & Gamification
- Historical performance progression curves and chronological score trajectory.
- Daily streaks, placement readiness XP index, and verifiable digital certificates.
- University-wide student leaderboard with real-time rankings.

---

## 🛠️ Architecture & Tech Stack

```
CampusEdge/
├── backend/                  # Node.js & Express API Server
│   ├── authRoutes.js         # JWT & bcrypt authentication
│   ├── codeRoutes.js         # Python runner & sandbox execution
│   ├── questionRoutes.js     # 2,050+ questions bank & test generator
│   ├── resumeRoutes.js       # ATS resume parsing & analysis
│   ├── userRoutes.js         # Student profiles & placement records
│   ├── server.js             # Express core, notifications & circulars
│   ├── db.js                 # PostgreSQL connection pool
│   └── middleware/           # JWT auth & admin role verification
│
├── frontend/                 # React 19 Single-Page Application (SPA)
│   ├── src/
│   │   ├── StudentDashboard.jsx  # Redesigned interactive student workspace
│   │   ├── AdminDashboard.jsx    # Recruiter & college placement cell portal
│   │   ├── CodingArena.jsx       # Multi-language code editor
│   │   ├── MockTest.jsx          # Proctored examination arena
│   │   ├── PracticeMode.jsx      # Interactive flashcard & quiz study
│   │   ├── ResumeChecker.jsx     # ATS resume scanner
│   │   ├── AIInterviewSimulator.jsx # Voice & webcam interview
│   │   ├── AuthPages.jsx         # Clean login/register portal
│   │   └── LandingPage.jsx       # Public landing page & demo hub
│   └── vite.config.js
└── README.md
```

### Technology Matrix
| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Tailwind CSS v4, Vite, React Router DOM, Lucide icons, Canvas Confetti |
| **Backend** | Node.js, Express 4, PostgreSQL `pg` pool, Multer, JWT, bcryptjs, pdf-parse |
| **Code Runner** | Local Python 3.10+ sub-process isolation with JSON serialization & timeout watchdog |
| **Database** | PostgreSQL 14+ |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)
- [Python](https://www.python.org/) 3.8+ (for local Python code sandbox)
- [Git](https://git-scm.com/)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/Ranadhruvi/CampusEdge.git
cd CampusEdge
```

---

### Step 2: Configure the Backend

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your PostgreSQL database credentials:
   ```env
   PORT=5000
   DB_USER=postgres
   DB_HOST=localhost
   DB_DATABASE=CampusEdge
   DB_PASSWORD=your_postgres_password
   DB_PORT=5432
   JWT_SECRET=your_super_secret_jwt_key_here
   ADMIN_SECRET_KEY=placement_cell_2026_admin
   FRONTEND_URL=http://localhost:5173
   ```

3. Initialize the database schema and seed questions:
   ```bash
   node scripts/seedQuestions.js
   ```

4. Start the backend server:
   ```bash
   npm start
   ```
   *The backend will start on `http://localhost:5000`.*

---

### Step 3: Configure the Frontend

1. Open a new terminal and navigate to `frontend`:
   ```bash
   cd ../frontend
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will launch at `http://localhost:5173`.*

---

## 🔒 Security Best Practices Implemented
- **Password Protection**: Multi-round `bcrypt` hashing strictly enforced; zero plaintext password fallbacks.
- **Strict Authorization**: All assessment, code execution, and resume endpoints verify signed JWT tokens.
- **Code Execution Sandbox**: Python test runner enforces a 3-second hard timeout and isolates standard library access.
- **SQL Injection Prevention**: Parameterized queries (`$1, $2`) across all PostgreSQL database operations.
- **CORS Protection**: Restricted whitelist allowing only trusted client origins.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
