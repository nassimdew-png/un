# 🏗️ System Architecture Overview — PsyPro Tech

PsyPro Tech is built as a **Modular Multi-Tenant SaaS Platform** optimized for clinical psychology and speech-language therapy practices. The platform follows a decoupled Single Page Application (SPA) frontend and a RESTful API backend architecture, strictly enforcing multi-tenant data isolation and role-based access control.

---

## 📐 High-Level Architecture Diagram

```text
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  [ Clinic Desktop Web ]     [ Tablet Kiosk Mode ]     [ Public Booking Portal ]   |
+----------------------------------------+------------------------------------------+
                                         | HTTPS (SSL / TLS)
                                         v
+-----------------------------------------------------------------------------------+
|                            REVERSE PROXY & WEB SERVER                             |
|                                    Nginx                                          |
|         +------------------------------+------------------------------+           |
|         | Static Assets & SPA Routing  | API Proxy (/api/*)           |           |
|         v                              v                              |           |
|  [ Vite / React 18 (Port 3001) ]   [ Laravel 11 Backend (Port 8000) ] |           |
+----------------------------------------+------------------------------+-----------+
                                         |
+----------------------------------------v------------------------------------------+
|                                BACKEND APPLICATION                                |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                       MIDDLEWARE & AUTHENTICATION                           |  |
|  |       Laravel Sanctum (Bearer Token)  |  TenantScope (clinic_id)            |  |
|  |       Role Middleware: SuperAdmin, ClinicAdmin, Therapist, Receptionist     |  |
|  +-------------------------------------+---------------------------------------+  |
|                                        |                                          |
|  +-------------------------------------v---------------------------------------+  |
|  |                             API CONTROLLERS                                 |  |
|  |  +----------------------+  +---------------------+  +--------------------+  |  |
|  |  | Clinic & Patient EMR |  | Tests & Exercises   |  | SuperAdmin Panel   |  |  |
|  |  +----------------------+  +---------------------+  +--------------------+  |  |
|  |  | Appointments & Queue |  | Clinical AI Engine  |  | Gateways & Quotas  |  |  |
|  |  +----------------------+  +---------------------+  +--------------------+  |  |
|  +-------------------------------------+---------------------------------------+  |
|                                        |                                          |
|  +-------------------------------------v---------------------------------------+  |
|  |                        SERVICE & INTEGRATION LAYER                          |  |
|  |  - AI Orchestrator (Google Gemini 1.5/2.0, DeepSeek V3/R1, OpenAI GPT-4o)  |  |
|  |  - Communication Hub (WhatsApp Cloud API, SMS Gateways, SMTP)             |  |
|  |  - PDF Generation & Medical Export Engines                                  |  |
|  +-------------------------------------+---------------------------------------+  |
+----------------------------------------+------------------------------------------+
                                         |
+----------------------------------------v------------------------------------------+
|                               DATA PERSISTENCE                                    |
|  [ MySQL Database ]            [ File Storage ]          [ In-Memory Cache ]      |
|  - Encrypted Credentials       - Patient Uploads         - Application Cache      |
|  - Multi-Tenant Data Sets      - Printable Worksheets    - Rate Limiting State    |
+-----------------------------------------------------------------------------------+
```

---

## 🧩 Architectural Layers & Design Decisions

### 1. Frontend Architecture (`/frontend`)
* **Framework:** React 18 powered by Vite for rapid HMR and optimized tree-shaking.
* **Styling:** Tailwind CSS with a unified dark clinical palette (`#0B0F19`, `#111827`, `#1F2937`).
* **Routing Structure:**
  * `/` ➡️ Authentication & Clinic Landing
  * `/dashboard` ➡️ Clinical Operations & EMR Dashboard
  * `/patients/*` ➡️ Patient Chart, Medical History, Longitudinal Tracking
  * `/clinical-tests` ➡️ Standardized Diagnostic Batteries (CARS-2, BDI-II, Conners-3, PCC)
  * `/exercises-bank` ➡️ Therapeutic Workbooks, Articulation Audio Player, PECS Builder
  * `/tablet/kiosk` ➡️ Touchscreen-Optimized Patient Self-Assessment
  * `/superadmin/*` ➡️ Tenant Management, AI Provider Switcher, Global Quotas
* **State & Networking:** Zustand for UI states, Axios with global request/response interceptors for Bearer Token handling and 401 redirect handling.

### 2. Backend Architecture (`/backend`)
* **Framework:** Laravel 11 running on PHP 8.2+.
* **Authentication:** Laravel Sanctum issuing stateless API tokens.
* **Multi-Tenancy Model:** Single database with soft logical isolation using `clinic_id` column scopes across tenant-owned models (Patient, Appointment, Consultation, Invoice).
* **Super Admin Isolation:** SuperAdmin routes operate outside standard tenant scoping, granting full oversight across licenses, quotas, and global communication settings.

---

## 🔒 Security & Data Isolation Protocols

* **Zero-Leakage Multi-Tenancy:** Global model scopes automatically constrain all patient and clinical queries to the authenticated user's `clinic_id`.
* **Credential Encryption:** All third-party AI keys (Gemini, OpenAI, DeepSeek) and communication secrets (WhatsApp tokens, SMTP passwords) are stored encrypted at rest.
* **Host Header Whitelisting:** Vite and Nginx enforce strict domain validation (`psypro.tech`, tenant subdomains) to protect against DNS rebinding attacks.

---

## ⚙️ Runtime & Deployment Topology

* **Process Management:** PM2 runs backend and frontend services under persistent process monitors with auto-restart on memory thresholds.
* **Nginx Reverse Proxy:** Terminates SSL, manages HTTP/2, serves cached static assets, and transparently routes `/api/*` requests to the Laravel service.
* **Git Branching Policy:** `master` represents production-stable releases; active feature development executes inside dedicated `feature/*` branches.
