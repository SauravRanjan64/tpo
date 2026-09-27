# DCRUST Campus Placement & Eligibility Portal (V2)

Official, production-quality frontend application for the **Deenbandhu Chhotu Ram University of Science and Technology (DCRUST), Murthal** Training & Placement Cell.

---

## 🌟 Key Features

### 🎓 Students
- **University Authentication**: Secure HttpOnly cookie-based session management.
- **First-Login Placement Consent Barrier**: Mandatory full-page data processing consent before accessing drives.
- **Academic Profile Management**: Indian engineering disciplines (CSE, IT, ECE, EEE, ME, Civil, Biotech), CGPA, Semester, Roll Number, Registration Number, and Active Backlogs.
- **Drive Discovery & Filters**: Filter by Branch, Job Type, Location, and Status.
- **Strict Real-time Eligibility Verification**: Evaluates CGPA, branch, active backlogs, and batch against cutoffs with exact transparent checkmarks. Students cannot apply if ineligible.
- **Apply Flow & Confirmation Dialog**: Explicit application confirmation modal.
- **Resume Management**: Upload, replace, and delete PDF/DOCX resumes (up to 5MB).
- **Resume Matcher**: Real-time keyword overlap analysis (Match Score %, Matched Skills, Missing Skills) with non-AI hiring disclaimer.
- **Application Tracking & Status Timeline**: Visual progress steps (Applied → Shortlisted → Selected / Rejected).
- **Live Notifications**: Powered by Socket.IO for immediate status updates.

### 🏢 T&P Administration
- **Placement Dashboard**: Real-time metrics (Total Students, Companies, Active Drives, Applications, Shortlisted, Selected) with branch-wise distribution charts.
- **Student Management**: Directory with filters and privacy-masked mobile numbers (`98******90`).
- **Company Management**: Employer verification and partner directory.
- **5-Section Job Drive Wizard**: Form with Basic Info, Academic Cutoffs, Skills, Application Period, and Final Review.
- **CSV Data Exporter**: Multi-parameter CSV download for offline records.
- **Audit Logs**: Immutable event tracking for administrative oversight.

### 💼 Corporate Recruiters
- **Recruiter Dashboard**: Drive statistics and candidate screening funnel.
- **Candidate Screening**: Search and filter applicants with privacy-masked contact info.
- **Shortlisting & Rejection Workflows**: One-click actions with modal confirmation that trigger real-time student updates.
- **Shortlisted Candidate Directory**: Applicant status view with student contact details kept masked.

---

## 🎨 Slate + Indigo Design System

- **Primary**: Indigo (`#4f46e5`)
- **Secondary**: Slate (`#0f172a` to `#f8fafc`)
- **Status Indicators**:
  - `ELIGIBLE`: Emerald
  - `APPLIED`: Indigo
  - `SHORTLISTED`: Blue/Indigo
  - `SELECTED`: Emerald
  - `REJECTED`: Rose
  - `PENDING`: Amber
  - `CLOSED`: Slate
- **India-First UI**: Currency symbol `₹` (INR), LPA package brackets, standard Indian engineering branches, semester tracking.

---

## Getting Started

### Configure MongoDB

The backend requires MongoDB; it does not fall back to browser or in-memory application data. Use MongoDB Atlas or a local replica set (application state changes use MongoDB transactions).

Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI` and a private `JWT_SECRET` of at least 32 characters. Do not commit `.env`.

### Install and seed development data

```powershell
npm install
npm install --prefix frontend
npm install --prefix backend
npm run db:seed --prefix backend
npm run dev
```

The frontend is available at `http://localhost:5173`, the API at `http://localhost:5000`, and API documentation at `http://localhost:5000/docs`.

### Deployment environment

Production frontend builds use `https://placement-dcrust.onrender.com/api` (configured in `frontend/.env.production`). For Vercel, set `VITE_API_URL` to that same API URL in the project's Environment Variables and redeploy. The backend must allow `https://placement-dcrust.vercel.app` in `CORS_ORIGIN`; the default backend configuration already includes it. Configure `MONGODB_URI` and `JWT_SECRET` as private Render environment variables, never as frontend variables or committed files.

Seeded development-only accounts (password: `Student@123` for students, `Recruiter@123` for the recruiter, and `Admin@123` for the T&P admin):

| Role | Email |
|---|---|
| Student | `student@dcrust.ac.in` |
| Ineligible student | `priya@dcrust.ac.in` |
| Student consent test | `aman@dcrust.ac.in` |
| Company recruiter | `recruiter@tcs.com` |
| T&P Admin | `admin@dcrust.edu.in` |

Change or remove these seeded accounts before deploying to a shared or production environment. Login uses the backend HttpOnly cookie; the frontend does not store authentication tokens.

### Tests and production build

```powershell
npm test --prefix backend
npm run build --prefix frontend
```
