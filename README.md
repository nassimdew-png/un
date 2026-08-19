# 🏥 PsyPro - Cloud Platform for Psychology & Orthophonie Clinics

**PsyPro** (SaaS MVP) is a specialized multi-tenant clinical management system tailored for Speech Therapy (الأرطوفونيا / Orthophonie) and Psychology clinics. Featuring clinical AI pipelines, automated Bilan generation, interactive Tablet Kiosk mode, and multi-tenant MongoDB data isolation.

---

## 🏛️ Architecture Overview

- **Frontend**: React 18 + Vite (PWA / Responsive Tablet Kiosk Mode / RTL Arabic & LTR)
- **Backend API**: PHP / Laravel 11 (Multi-tenancy Subdomain Isolation, RBAC, REST API)
- **AI Clinical Microservice**: Python / FastAPI (Clinical NLP, De-identification Anonymizer, Ortho Bilan Generator, Psychometric Test Scoring)
- **Database**: MongoDB 6.0 Engine
- **Reverse Proxy**: Traefik 2.10 (Subdomain Routing & SSL Termination)

---

## 📁 Monorepo Structure

```text
psypro/
├── .github/workflows/deploy.yml   # CI/CD deployment pipeline
├── docker-compose.yml             # Full-stack Docker orchestration
├── .env.example                   # Global environment template
├── scaffold.md                    # System architecture specification
│
├── frontend/                      # React + Vite PWA Application
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── layouts/               # AdminLayout, SpecialistLayout, TabletLayout
│   │   ├── pages/                 # Auth, Superadmin, Patients, Orthophonie, Psychology, Tablet
│   │   ├── services/              # API Client (Subdomain aware)
│   │   └── store/                 # Zustand state management
│
├── backend/                       # Laravel 11 REST API
│   ├── app/Http/Controllers/      # Auth, Tenant, Patient, Appointment, OrthoBilan, TabletSession
│   ├── app/Http/Middleware/       # TenantResolver (Subdomain), RoleMiddleware
│   ├── app/Models/                # Tenant, User, Patient, Appointment, OrthoBilan, TabletSession
│   ├── app/Services/              # AIServiceClient, PDFReportGenerator
│   └── routes/api.php             # REST API Routes
│
├── ai-service/                    # FastAPI AI Clinical Microservice
│   ├── app/routes/                # /bilan/generate, /tests/score, /session/soap-summary
│   ├── app/prompts/               # Orthophonie and Psychology clinical prompts
│   └── app/utils/anonymizer.py    # Strict PII de-identification sanitizer
│
└── proxy/
    └── traefik.yml                # Traefik configuration
```

---

## 🚀 Quick Start (Docker)

1. **Clone & Setup Environment**:
   ```bash
   cp .env.example .env
   ```

2. **Launch All Services**:
   ```bash
   docker compose up --build -d
   ```

3. **Access Services**:
   - **Frontend App**: `http://psypro.local` (or `http://localhost:3000`)
   - **Tenant Subdomain Example**: `http://elamal.psypro.local`
   - **Superadmin Panel**: `http://admin.psypro.local`
   - **Backend API**: `http://api.psypro.local`
   - **AI Microservice Docs**: `http://localhost:8000/docs`
   - **Traefik Dashboard**: `http://localhost:8080`

---

## 🧩 Database Collections (MongoDB)

1. **`tenants`**: Clinic metadata, custom subdomain, specialty (`orthophonie`, `psychology`, `multidisciplinary`), subscription plans.
2. **`users`**: Staff accounts with roles (`superadmin`, `clinic_admin`, `orthophoniste`, `psychologue`, `receptionist`).
3. **`patients`**: Anamnesis notes, pregnancy, motor milestones, language background.
4. **`ortho_bilans`**: Clinical diagnostic observations, AI-generated comprehensive bilans, PDF links.
5. **`tablet_sessions`**: Kiosk test sessions, 4-digit PIN access, answers array, psychometric score interpretations (BDI-II, etc.).
6. **`appointments`**: Scheduling, status, and clinic specialist assignments.

---

## 🔒 Clinical AI Confidentiality & Privacy

All AI synthesis requests pass through `app/utils/anonymizer.py` before hitting external LLMs (Gemini / OpenAI). Names, phone numbers, addresses, and identifying dates are masked and replaced with clinical tokens (e.g. `[PATIENT_NAME]`, `[PHONE]`) to uphold strict medical ethics and data privacy regulations.
