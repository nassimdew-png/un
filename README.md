# 🧠 PsyPro Tech (Clinical Management SaaS for Psychology & Speech Therapy Clinics)

A comprehensive cloud-based SaaS platform tailored for clinical psychologists, speech-language pathologists (SLPs), and rehabilitation centers. It provides electronic medical records, standardized diagnostic testing batteries, therapeutic exercise banks, and advanced clinical AI workflows.

---

## 🛠️ Tech Stack

* **Backend:** Laravel 11 (PHP 8.2+), Laravel Sanctum (Token Authentication), MySQL Database.
* **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Axios, Zustand.
* **Infrastructure & Server:** Ubuntu Linux VPS, Nginx, PM2 Process Manager, SSL (Let's Encrypt).
* **AI Integrations:** Google Gemini 1.5/2.0, DeepSeek V3/R1, OpenAI GPT-4o.

---

## 🧩 Core Platform Modules

### 1. Clinical Tests & Standardized Scales (`/clinical-tests`)
* Standardized Arabic & Algerian diagnostic batteries (BDI-II, CARS-2, Conners-3, SSI-4, PCC).
* Instant automated scoring and one-click psychological/speech report generation.
* Dedicated Tablet/Kiosk mode (`/tablet/kiosk`) for patient self-administration.

### 2. Therapeutic Exercises & Workbooks Bank (`/exercises-bank`)
* Phoneme articulation cards and speech training with an interactive audio player.
* Printable PDF therapeutic workbooks (mazes, fine motor tracking, visual perception).
* Picture Exchange Communication System (PECS) and social story sets.
* Direct homework assignment workflow linked to patient charts.

### 3. Clinic & Electronic Medical Records (EMR)
* Comprehensive pediatric and adult patient records, longitudinal history, and SOAP clinical notes.
* Appointment scheduling, waiting list triage, and smart waiting room queue (Kiosk Mode).
* Billing, automated invoices, and local Algerian payment verification (BaridiMob / CCP).

### 4. Super Admin Control Panel
* Clinic subscription lifecycle, license tiers, and resource quota management.
* Unified AI provider gateway with real-time token and latency connection testing.
* Communication gateways (WhatsApp Cloud API, SMS gateways, SMTP).
* Global Feature Master Switches for zero-downtime feature rollouts.

---

## 🛡️ Safe Git Development Workflow

To ensure production server stability and prevent file loss:

1. **Main Branch (`master`):** Reserved exclusively for tested, production-ready releases.
2. **Feature Branches (`feature/*`):** All active development and refactoring take place in isolated branches.
3. **Safety Rules:**
   * Destructive commands like `git reset --hard` and `npm audit fix --force` are strictly forbidden on production.
   * Full frontend build checks (`npm run build`) and cache clearing must pass before merging.

---

## 🚀 Quick Maintenance Commands

```bash
# Clear and optimize Laravel backend caches
cd /var/www/clinic-saas/backend
php artisan optimize:clear

# Build frontend production bundle
cd /var/www/clinic-saas/frontend
npm run build

# Restart runtime services
pm2 restart all
```
