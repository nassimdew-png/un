\# 🏥 ClinicSaaS Architecture & Project Scaffold

\> \*\*المنصة السحابية المتكاملة لإدارة عيادات ومراكز علم النفس والأرطوفونيا (SaaS MVP)\*\*\[cite: 1, 2\]  
\> نظام متعدد المستأجرين (Multi-Tenancy) مدعوم بالذكاء الاصطناعي الإكلينيكي ووضع التابلت التفاعلي\[cite: 1, 2\].

\---

\#\# 1\. المعمارية التقنية العامة (Tech Stack Architecture)

                  \[ 🌐 Internet / Clients \]  
                              │  
                              ▼  
                \[ 🛡️ Traefik Reverse Proxy \]  
           (SSL Termination, Subdomain Routing)  
                              │  
    ┌─────────────────────────┼─────────────────────────┐  
    ▼                         ▼                         ▼

┌──────────────┐ ┌──────────────┐ ┌──────────────┐

│ Frontend │ │ Backend │ │ AI Service │

│ React \+ Vite │ │ PHP / Laravel│ │Python/FastAPI│

│ (PWA/Tablet) │ │ (REST API) │ │(LLM Pipelines│

└──────────────┘ └──────────────┘ └──────────────┘

│ │

└────────────┬────────────┘

▼

┌────────────────────┐

│ Database │

│ MongoDB Engine │

└────────────────────┘

\---

\#\# 2\. هيكل المجلدات الموحد (Monorepo Folder Structure)

\`\`\`text  
clinic-saas/  
├── .github/  
│   └── workflows/  
│       └── deploy.yml              \# أتمتة النشر عبر CI/CD  
├── docker-compose.yml              \# تشغيل كامل الخدمات وحاويات Docker  
├── .env.example                    \# متغيرات البيئة العامة  
├── Scaffold.md                     \# التوثيق المعماري للمشروع  
│  
├── frontend/                       \# تطبيق الواجهة الأمامية (React)  
│   ├── Dockerfile  
│   ├── package.json  
│   ├── vite.config.js  
│   ├── public/  
│   └── src/  
│       ├── assets/  
│       ├── components/             \# المكونات المشتركة (Buttons, Modals, Forms)  
│       ├── layouts/                \# تخطيط الصفحات (AdminLayout, SpecialistLayout, TabletLayout)  
│       ├── pages/  
│       │   ├── auth/               \# تسجيل الدخول واستعادة الحساب  
│       │   ├── superadmin/         \# لوحة تحكم مالك المنصة  
│       │   ├── appointments/       \# الأجندة ورزنامة المواعيد  
│       │   ├── patients/           \# إدارة سجلات المرضى  
│       │   ├── orthophonie/        \# استمارة الحصيلة الأرطوفونية ومولد التقارير  
│       │   ├── psychology/         \# جلسات الملاحظات والمقاييس النفسية  
│       │   └── tablet/             \# وضع التابلت المنفصل (Kiosk Mode)  
│       ├── hooks/  
│       ├── services/               \# استدعاءات API (Axios Instances)  
│       └── store/                  \# إدارة الحالة (Zustand / Redux)  
│  
├── backend/                        \# الواجهة الخلفية الأساسية (Laravel API)  
│   ├── Dockerfile  
│   ├── composer.json  
│   ├── app/  
│   │   ├── Http/  
│   │   │   ├── Controllers/  
│   │   │   │   ├── AuthController.php  
│   │   │   │   ├── TenantController.php  
│   │   │   │   ├── PatientController.php  
│   │   │   │   ├── AppointmentController.php  
│   │   │   │   ├── OrthoBilanController.php  
│   │   │   │   └── TabletSessionController.php  
│   │   │   ├── Middleware/  
│   │   │   │   ├── TenantResolver.php      \# عزل البيانات عبر Subdomain  
│   │   │   │   └── RoleMiddleware.php      \# التحقق من الصلاحيات (RBAC)  
│   │   ├── Models/  
│   │   │   ├── Tenant.php  
│   │   │   ├── User.php  
│   │   │   ├── Patient.php  
│   │   │   ├── Appointment.php  
│   │   │   └── OrthoBilan.php  
│   │   └── Services/  
│   │       ├── AIServiceClient.php         \# التواصل الداخلي مع FastAPI  
│   │       └── PDFReportGenerator.php      \# محرك تصدير الـ PDF  
│   ├── config/  
│   │   └── database.php                    \# إعدادات الاتصال بـ MongoDB  
│   └── routes/  
│       └── api.php                         \# مسارات الـ REST API  
│  
├── ai-service/                     \# المحرك الإكلينيكي الذكي (FastAPI)  
│   ├── Dockerfile  
│   ├── requirements.txt  
│   └── app/  
│       ├── main.py                         \# نقطة الدخول والسيرفر  
│       ├── config.py                       \# مفاتيح APIs (Gemini / OpenAI)  
│       ├── routes/  
│       │   ├── bilan\_generator.py          \# صياغة الحصيلة الأرطوفونية  
│       │   ├── test\_scoring.py             \# تصحيح وتحليل درجات المقاييس  
│       │   └── session\_summary.py          \# تلخيص ملاحظات الجلسات (SOAP)  
│       ├── prompts/  
│       │   ├── orthophonie\_system\_prompt.py  
│       │   └── psychological\_report\_prompt.py  
│       └── utils/  
│           └── anonymizer.py               \# تعتيم البيانات الشخصية وحماية السرية  
│  
└── proxy/                          \# إعدادات التوجيه والشبكة  
    └── traefik.yml                 \# إعدادات Traefik ومسارات الـ SSL

## **3\. نماذج المستندات في قاعدة البيانات (MongoDB Schemas)**

### **أ. مستند العيادة (Tenants Collection)**

JSON  
{  
  "\_id": "ObjectId",  
  "name": "عيادة الأمل للأرطوفونيا والدعم النفسي",  
  "subdomain": "elamal",  
  "specialty\_type": "multidisciplinary",  
  "subscription": {  
    "status": "active",  
    "plan": "annual\_standard",  
    "expires\_at": "2027-08-19T00:00:00Z"  
  },  
  "settings": {  
    "logo\_url": "https://...",  
    "phone": "0550000000",  
    "address": "الجزائر العاصمة"  
  },  
  "created\_at": "2026-08-19T00:00:00Z"  
}

### **ب. مستند المريض (Patients Collection)**

JSON  
{  
  "\_id": "ObjectId",  
  "tenant\_id": "Tenant\_ObjectId",  
  "full\_name": "ياسين بن علي",  
  "birth\_date": "2018-05-12",  
  "gender": "male",  
  "guardian\_name": "محمد بن علي (الأب)",  
  "phone": "0661000000",  
  "anamnese\_generale": {  
    "pregnancy\_notes": "ولادة طبيعية دون مضاعفات",  
    "motor\_development": "المشي في عمر 13 شهراً",  
    "school\_grade": "السنة الأولى ابتدائي"  
  },  
  "created\_at": "2026-08-19T00:00:00Z"  
}

### **ج. مستند الحصيلة الأرطوفونية والذكاء الاصطناعي (Ortho Bilans Collection)**

JSON  
{  
  "\_id": "ObjectId",  
  "tenant\_id": "Tenant\_ObjectId",  
  "patient\_id": "Patient\_ObjectId",  
  "specialist\_id": "User\_ObjectId",  
  "bilan\_type": "initial",  
  "clinical\_input": {  
    "vocal\_articulation": "تشويه نطق حرفي /s/ و /z/",  
    "expressive\_language": "تأخر لغوي بسيط في بناء الجمل المركبة",  
    "comprehension": "فهم سليم للأوامر البسيطة والمعقدة",  
    "stuttering": "لا توجد تأتأة"  
  },  
  "ai\_generated\_report": "نص الحصيلة الإكلينيكية الرسمي المولد بالـ AI...",  
  "pdf\_path": "/storage/bilans/bilan\_501.pdf",  
  "created\_at": "2026-08-19T00:00:00Z"  
}

### **د. مستند جلسة التابلت (Tablet Kiosk Sessions Collection)**

JSON  
{  
  "\_id": "ObjectId",  
  "tenant\_id": "Tenant\_ObjectId",  
  "patient\_id": "Patient\_ObjectId",  
  "specialist\_id": "User\_ObjectId",  
  "test\_type": "BDI-II",  
  "pin\_code": "4819",  
  "status": "completed",  
  "answers": \[0, 2, 1, 3, 0, 1\],  
  "results": {  
    "total\_score": 24,  
    "severity": "Moderate Depression",  
    "calculated\_at": "2026-08-19T00:00:00Z"  
  }  
}

## **4\. مسار تشغيل البيئة الموحدة (docker-compose.yml)**

YAML  
version: '3.8'

services:  
  traefik:  
    image: traefik:v2.10  
    container\_name: clinic\_traefik  
    command:  
      \- "--api.insecure=false"  
      \- "--providers.docker=true"  
      \- "--entrypoints.web.address=:80"  
      \- "--entrypoints.websecure.address=:443"  
    ports:  
      \- "80:80"  
      \- "443:443"  
    volumes:  
      \- "/var/run/docker.sock:/var/run/docker.sock:ro"  
    networks:  
      \- clinic\_net

  mongodb:  
    image: mongo:6.0  
    container\_name: clinic\_mongodb  
    restart: always  
    environment:  
      MONGO\_INITDB\_ROOT\_USERNAME: root  
      MONGO\_INITDB\_ROOT\_PASSWORD: secure\_password  
    volumes:  
      \- mongo\_data:/data/db  
    networks:  
      \- clinic\_net

  backend:  
    build:  
      context: ./backend  
    container\_name: clinic\_backend  
    restart: always  
    environment:  
      DB\_CONNECTION: mongodb  
      DB\_HOST: mongodb  
      DB\_PORT: 27017  
      DB\_DATABASE: clinic\_saas\_db  
      AI\_SERVICE\_URL: http://ai-service:8000  
    depends\_on:  
      \- mongodb  
    networks:  
      \- clinic\_net

  ai-service:  
    build:  
      context: ./ai-service  
    container\_name: clinic\_ai\_service  
    restart: always  
    environment:  
      GEMINI\_API\_KEY: ${GEMINI\_API\_KEY}  
    networks:  
      \- clinic\_net

  frontend:  
    build:  
      context: ./frontend  
    container\_name: clinic\_frontend  
    restart: always  
    depends\_on:  
      \- backend  
    networks:  
      \- clinic\_net

networks:  
  clinic\_net:  
    driver: bridge

volumes:  
  mongo\_data:

\#\#\# طريقة إنشائه بسرعة عبر الطرفية (Terminal):  
يمكنك إنشاء الملف مباشرة داخل مجلد المشروع بتنفيذ الأمر التالي في الطرفية:

\`\`\`bash  
cat \<\< 'EOF' \> Scaffold.md  
\# الصق المحتوى أعلاه هنا  
EOF  
