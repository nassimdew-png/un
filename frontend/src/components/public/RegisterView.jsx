import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  Sparkles,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Gift,
  Check,
  ShieldCheck,
  Eye,
  EyeOff,
  Stethoscope,
  Globe,
  Award,
  Layers,
  HelpCircle
} from 'lucide-react';
import { authApi } from '../../api';

const ALGERIAN_WILAYAS_58 = [
  { code: '01', nameAr: 'أدرار', nameFr: 'Adrar' },
  { code: '02', nameAr: 'الشلف', nameFr: 'Chlef' },
  { code: '03', nameAr: 'الأغواط', nameFr: 'Laghouat' },
  { code: '04', nameAr: 'أم البواقي', nameFr: 'Oum El Bouaghi' },
  { code: '05', nameAr: 'باتنة', nameFr: 'Batna' },
  { code: '06', nameAr: 'بجاية', nameFr: 'Béjaïa' },
  { code: '07', nameAr: 'بسكرة', nameFr: 'Biskra' },
  { code: '08', nameAr: 'بشار', nameFr: 'Béchar' },
  { code: '09', nameAr: 'البليدة', nameFr: 'Blida' },
  { code: '10', nameAr: 'البويرة', nameFr: 'Bouira' },
  { code: '11', nameAr: 'تمنراست', nameFr: 'Tamanrasset' },
  { code: '12', nameAr: 'تبسة', nameFr: 'Tébessa' },
  { code: '13', nameAr: 'تلمسان', nameFr: 'Tlemcen' },
  { code: '14', nameAr: 'تيارت', nameFr: 'Tiaret' },
  { code: '15', nameAr: 'تيزي وزو', nameFr: 'Tizi Ouzou' },
  { code: '16', nameAr: 'الجزائر العاصمة', nameFr: 'Alger' },
  { code: '17', nameAr: 'الجلفة', nameFr: 'Djelfa' },
  { code: '18', nameAr: 'جيجل', nameFr: 'Jijel' },
  { code: '19', nameAr: 'سطيف', nameFr: 'Sétif' },
  { code: '20', nameAr: 'سعيدة', nameFr: 'Saïda' },
  { code: '21', nameAr: 'سكيكدة', nameFr: 'Skikda' },
  { code: '22', nameAr: 'سيدي بلعباس', nameFr: 'Sidi Bel Abbès' },
  { code: '23', nameAr: 'عنابة', nameFr: 'Annaba' },
  { code: '24', nameAr: 'قالمة', nameFr: 'Guelma' },
  { code: '25', nameAr: 'قسنطينة', nameFr: 'Constantine' },
  { code: '26', nameAr: 'المدية', nameFr: 'Médéa' },
  { code: '27', nameAr: 'مستغانم', nameFr: 'Mostaganem' },
  { code: '28', nameAr: 'المسيلة', nameFr: "M'Sila" },
  { code: '29', nameAr: 'معسكر', nameFr: 'Mascara' },
  { code: '30', nameAr: 'ورقلة', nameFr: 'Ouargla' },
  { code: '31', nameAr: 'وهران', nameFr: 'Oran' },
  { code: '32', nameAr: 'البيض', nameFr: 'El Bayadh' },
  { code: '33', nameAr: 'إليزي', nameFr: 'Illizi' },
  { code: '34', nameAr: 'برج بوعريريج', nameFr: 'Bordj Bou Arréridj' },
  { code: '35', nameAr: 'بومرداس', nameFr: 'Boumerdès' },
  { code: '36', nameAr: 'الطارف', nameFr: 'El Tarf' },
  { code: '37', nameAr: 'تندوف', nameFr: 'Tindouf' },
  { code: '38', nameAr: 'تسمسيلت', nameFr: 'Tissemsilt' },
  { code: '39', nameAr: 'الوادي', nameFr: 'El Oued' },
  { code: '40', nameAr: 'خنشلة', nameFr: 'Khenchela' },
  { code: '41', nameAr: 'سوق أهراس', nameFr: 'Souk Ahras' },
  { code: '42', nameAr: 'تيبازة', nameFr: 'Tipaza' },
  { code: '43', nameAr: 'ميلة', nameFr: 'Mila' },
  { code: '44', nameAr: 'عين الدفلى', nameFr: 'Aïn Defla' },
  { code: '45', nameAr: 'النعامة', nameFr: 'Naâma' },
  { code: '46', nameAr: 'عين تموشنت', nameFr: 'Aïn Témouchent' },
  { code: '47', nameAr: 'غرداية', nameFr: 'Ghardaïa' },
  { code: '48', nameAr: 'غليزان', nameFr: 'Relizane' },
  { code: '49', nameAr: 'تيميمون', nameFr: 'Timimoun' },
  { code: '50', nameAr: 'برج باجي مختار', nameFr: 'Bordj Badji Mokhtar' },
  { code: '51', nameAr: 'أولاد جلال', nameFr: 'Ouled Djellal' },
  { code: '52', nameAr: 'بني عباس', nameFr: 'Béni Abbès' },
  { code: '53', nameAr: 'عين صالح', nameFr: 'In Salah' },
  { code: '54', nameAr: 'عين قزام', nameFr: 'In Guezzam' },
  { code: '55', nameAr: 'تقرت', nameFr: 'Touggourt' },
  { code: '56', nameAr: 'جانت', nameFr: 'Djanet' },
  { code: '57', nameAr: 'المغير', nameFr: "El M'Ghair" },
  { code: '58', nameAr: 'المنيعة', nameFr: 'El Meniaa' },
];

export default function RegisterView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Robust multi-layer language detection (URL query param > localStorage > cookie > i18n state)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(location.search);
      const queryLang = urlParams.get('lang') || urlParams.get('locale');
      const cookieMatch = typeof document !== 'undefined'
        ? document.cookie.match(/(?:^|;\s*)(?:app_language|i18nextLng|locale)=([^;]+)/)
        : null;
      const cookieLang = cookieMatch ? cookieMatch[1] : null;

      const target = queryLang
        || localStorage.getItem('app_language')
        || localStorage.getItem('i18nextLng')
        || localStorage.getItem('locale')
        || cookieLang
        || i18n.language;

      if (target) {
        const clean = target.startsWith('fr') ? 'fr' : 'ar';
        if (i18n.language !== clean) {
          i18n.changeLanguage(clean);
        }
      }
    } catch (err) {
      console.warn('Locale synchronization notice:', err);
    }
  }, [location.search, i18n]);

  const currentLang = i18n.language || localStorage.getItem('app_language') || 'ar';
  const isAr = !currentLang || currentLang.startsWith('ar');

  const toggleLanguage = (lng) => {
    i18n.changeLanguage(lng);
    try {
      localStorage.setItem('app_language', lng);
      localStorage.setItem('i18nextLng', lng);
      localStorage.setItem('locale', lng);
      if (typeof document !== 'undefined') {
        document.cookie = `app_language=${lng};path=/;max-age=31536000;SameSite=Lax`;
        document.cookie = `locale=${lng};path=/;max-age=31536000;SameSite=Lax`;
        document.cookie = `i18nextLng=${lng};path=/;max-age=31536000;SameSite=Lax`;
      }
    } catch (e) {}
  };

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration Disabled State
  const [registrationDisabled, setRegistrationDisabled] = useState(false);
  const [registrationDisabledMessage, setRegistrationDisabledMessage] = useState('');
  const [checkingRegistrationStatus, setCheckingRegistrationStatus] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await authApi.getRegistrationStatus();
        if (res && res.is_disabled) {
          setRegistrationDisabled(true);
          setRegistrationDisabledMessage(res.message);
        }
      } catch (err) {
        // Continue normally
      } finally {
        setCheckingRegistrationStatus(false);
      }
    };
    fetchStatus();
  }, []);

  // Initial plan from landing navigation state or query param
  const queryParamPlan = new URLSearchParams(location.search).get('plan');
  const validPlans = ['starter', 'solo', 'duo', 'multi_pro', 'enterprise'];
  const passedPlan = location.state?.plan || queryParamPlan;
  const initialPlan = validPlans.includes(passedPlan) ? passedPlan : 'solo';

  const registrationPlans = [
    {
      id: 'starter',
      name: isAr ? 'الانطلاقة (Débutant)' : 'Démarrage (Débutant)',
      badge: isAr ? 'حديث التخرج 🚀' : 'Nouveau diplômé 🚀',
      price: isAr ? '25 000 دج / سنوياً' : '25 000 DZD / an',
      monthly: isAr ? '2 500 دج/شهر' : '2 500 DZD/mois',
      desc: isAr 
        ? 'أخصائي 1 • حتى 60 مريضاً • المقاييس الأساسية • تذكيرات WhatsApp'
        : '1 Praticien • Jusqu\'à 60 patients • Tests cliniques de base • Rappels WhatsApp',
    },
    {
      id: 'solo',
      name: isAr ? 'الأخصائي الفردي (Solo)' : 'Praticien Solo',
      badge: isAr ? 'الأكثر انتشاراً ⚡' : 'Le plus populaire ⚡',
      price: isAr ? '42 000 دج / سنوياً' : '42 000 DZD / an',
      monthly: isAr ? '4 500 دج/شهر' : '4 500 DZD/mois',
      desc: isAr
        ? 'أخصائي 1 + سكرتيرة • حتى 250 مريضاً • كشك الاستقبال • 50k توكن ذكاء اصطناعي'
        : '1 Praticien + 1 Secrétaire • 250 patients • Borne Kiosk • 50k tokens IA',
      popular: true,
    },
    {
      id: 'duo',
      name: isAr ? 'العيادة المشتركة (Duo)' : 'Cabinet Duo',
      badge: isAr ? 'قيمة استثنائية 🤝' : 'Collaboration 🤝',
      price: isAr ? '72 000 دج / سنوياً' : '72 000 DZD / an',
      monthly: isAr ? '7 500 دج/شهر' : '7 500 DZD/mois',
      desc: isAr
        ? 'أخصائيان (2) + 2 سكرتارية • ملفات غير محدودة • شاشة TV • 100k توكن'
        : '2 Praticiens + 2 Secrétaires • Dossiers illimités • Écran TV • 100k tokens IA',
    },
    {
      id: 'multi_pro',
      name: isAr ? 'المركز المتكامل (Multi-Pro)' : 'Centre Multi-Pro',
      badge: isAr ? 'الموصى به للمراكز 🔥' : 'Recommandé Centres 🔥',
      price: isAr ? '120 000 دج / سنوياً' : '120 000 DZD / an',
      monthly: isAr ? '12 500 دج/شهر' : '12 500 DZD/mois',
      desc: isAr
        ? 'حتى 8 أخصائيين • كافة الاختبارات (35+) • محاسبة النسب • بوابة أولياء الأمور • 250k توكن'
        : 'Jusqu\'à 8 Praticiens • Tous les tests (35+) • Portail Parents • 250k tokens IA',
      popular: true,
    },
    {
      id: 'enterprise',
      name: isAr ? 'المؤسسات (Enterprise)' : 'Groupe Enterprise',
      badge: isAr ? 'مجمعات كبرى 🏢' : 'Grandes structures 🏢',
      price: isAr ? '210 000 دج / سنوياً' : '210 000 DZD / an',
      monthly: isAr ? '22 000 دج/شهر' : '22 000 DZD/mois',
      desc: isAr
        ? 'حتى 25 أخصائياً • فروع متعددة • نطاق خاص • دعم VIP 24/7 • 500k توكن'
        : 'Jusqu\'à 25 Praticiens • Multi-succursales • Domaine personnalisé • Support VIP 24/7',
    },
  ];

  const [formData, setFormData] = useState({
    clinic_name: '',
    specialty: 'orthophonie',
    wilaya_code: '16',
    wilaya_name: 'الجزائر العاصمة',
    subdomain: '',
    clinic_phone: '',
    commune: '',
    // Doctor Details
    owner_name: '',
    license_number: '',
    email: '',
    phone: '',
    password: '',
    // Plan & Customization
    selected_plan: initialPlan,
    promo_code: '',
    seed_sample_data: true,
  });

  // Calculate Password Strength
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const passStrength = getPasswordStrength(formData.password);

  // Auto generate clean slug
  const handleClinicNameChange = (e) => {
    const val = e.target.value;
    let autoSubdomain = formData.subdomain;

    if (!formData.subdomain || formData.subdomain === slugify(formData.clinic_name)) {
      autoSubdomain = slugify(val);
    }

    setFormData({
      ...formData,
      clinic_name: val,
      subdomain: autoSubdomain,
    });
  };

  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
  };

  const handleWilayaChange = (e) => {
    const code = e.target.value;
    const found = ALGERIAN_WILAYAS_58.find((w) => w.code === code);
    setFormData({
      ...formData,
      wilaya_code: code,
      wilaya_name: found ? `${found.code} - ${isAr ? found.nameAr : found.nameFr}` : '16 - Alger',
    });
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!formData.clinic_name.trim()) {
        setError(isAr ? 'يرجى إدخال اسم العيادة أو المركز الطبي.' : 'Veuillez renseigner le nom de la clinique ou du cabinet.');
        return;
      }
      if (!formData.subdomain.trim() || formData.subdomain.length < 3) {
        setError(isAr ? 'يرجى تحديد نطاق سحابي للعيادة (3 أحرف على الأقل، حروف إنجليزية وأرقام فقط).' : 'Veuillez définir un sous-domaine valide (au moins 3 caractères alphanumériques).');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.owner_name.trim()) {
        setError(isAr ? 'يرجى إدخال الاسم واللقب الكامل للأخصائي المسؤول.' : 'Veuillez saisir le nom et prénom complet du praticien.');
        return;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setError(isAr ? 'يرجى إدخال بريد إلكتروني صالح.' : 'Veuillez entrer une adresse email valide.');
        return;
      }
      if (!formData.phone.trim() || formData.phone.length < 9) {
        setError(isAr ? 'يرجى إدخال رقم هاتف صالح (مثال: 0550112233).' : 'Veuillez saisir un numéro de téléphone valide.');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setError(isAr ? 'يجب أن تتكون كلمة المرور من 6 خانات على الأقل.' : 'Le mot de passe doit contenir au moins 6 caractères.');
        return;
      }
      setStep(3);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        clinic_name: formData.clinic_name.trim(),
        specialty: formData.specialty,
        wilaya: formData.wilaya_name,
        wilaya_code: formData.wilaya_code,
        subdomain: formData.subdomain.trim().toLowerCase(),
        owner_name: formData.owner_name.trim(),
        license_number: formData.license_number.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        promo_code: formData.promo_code.trim(),
        seed_sample_data: formData.seed_sample_data,
        plan: formData.selected_plan,
      };

      const res = await authApi.registerClinic(payload);

      if (res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('clinic_token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        if (res.clinic?.id) {
          localStorage.setItem('clinic_id', res.clinic.id);
        }
        window.location.href = '/dashboard';
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.is_registration_disabled || err.is_registration_disabled) {
        setRegistrationDisabled(true);
        if (err.response?.data?.message || err.message) {
          setRegistrationDisabledMessage(err.response?.data?.message || err.message);
        }
      }
      setError(err.message || (isAr ? 'تعذر إتمام إنشاء الحساب. يرجى التأكد من عدم استخدام نفس البريد أو النطاق مسبقاً.' : 'Impossible de finaliser l\'inscription. Vérifiez que l\'email ou le sous-domaine n\'est pas déjà utilisé.'));
      setLoading(false);
    }
  };

  return (
    <div 
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-brand-500 selection:text-white ${isAr ? 'text-right' : 'text-left'}`} 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      
      {/* Top Header */}
      <header className="p-4 sm:p-6 border-b border-slate-800/80 max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition border border-slate-800 bg-slate-950 p-0.5 shrink-0">
            <img src="/psysnap-logo.png" alt="PsySnap" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <span className="text-xl font-black text-white font-mono">
              PsySnap
            </span>
            <span className="text-[10px] text-slate-400 block font-bold">
              {isAr ? 'بوابة إنشاء العيادات السحابية' : 'Portail d\'Inscription Cabinet Cloud'}
            </span>
          </div>
        </Link>

        {/* Right Header: Language Switcher & Login Link */}
        <div className="flex items-center gap-3">
          {/* Dual Language Selector Button */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs shadow-md">
            <button
              type="button"
              onClick={() => toggleLanguage('ar')}
              className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1 ${
                isAr ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🇩🇿</span>
              <span className="hidden sm:inline">العربية</span>
            </button>
            <button
              type="button"
              onClick={() => toggleLanguage('fr')}
              className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1 ${
                !isAr ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🇫🇷</span>
              <span className="hidden sm:inline">Français</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>{isAr ? 'لديك عيادة مسجلة بالفعل؟' : 'Déjà inscrit ?'}</span>
            <Link
              to={isAr ? "/login" : "/login?lang=fr"}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-brand-400 hover:text-brand-300 font-bold transition"
            >
              {isAr ? 'تسجيل الدخول' : 'Connexion'}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {registrationDisabled ? (
          <div className="bg-slate-900/95 border-2 border-rose-500/40 rounded-3xl p-8 sm:p-12 max-w-2xl w-full shadow-2xl text-center space-y-6 relative overflow-hidden backdrop-blur-xl animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-3xl shadow-xl shadow-rose-500/10">
              🔒
            </div>
            
            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-block">
                {isAr ? 'إشعار إداري وسريري رسمي' : 'Information officielle'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {isAr ? 'التسجيل لعيادات جديدة مغلق مؤقتاً' : 'Les inscriptions sont temporairement suspendues'}
              </h2>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
              {registrationDisabledMessage || (isAr ? 'نعتذر، التسجيل لعيادات جديدة مغلق مؤقتاً لأعمال الصيانة والتحديثات السريرية. يرجى المحاولة في وقت لاحق.' : 'Désolé, les inscriptions de nouveaux cabinets sont temporairement fermées pour maintenance.')}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={isAr ? "/login" : "/login?lang=fr"}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-brand-500/20 transition flex items-center justify-center gap-2"
              >
                <span>{isAr ? 'تسجيل الدخول للعيادات المشتركة 🩺' : 'Accès aux cabinets existants 🩺'}</span>
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <span>{isAr ? 'العودة للصفحة الرئيسية' : 'Retour à l\'accueil'}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-2xl w-full shadow-2xl space-y-8 relative overflow-hidden">
          
          {/* Ambient Corner Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Stepper Wizard Bar */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className={`flex items-center gap-1.5 ${step >= 1 ? 'text-brand-400 font-black' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  1
                </span>
                <span>{isAr ? 'هوية العيادة' : 'Cabinet'}</span>
              </span>

              <span className={`flex items-center gap-1.5 ${step >= 2 ? 'text-brand-400 font-black' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  2
                </span>
                <span>{isAr ? 'بيانات الطبيب' : 'Praticien'}</span>
              </span>

              <span className={`flex items-center gap-1.5 ${step >= 3 ? 'text-brand-400 font-black' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step >= 3 ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  3
                </span>
                <span>{isAr ? 'الخطة والتفعيل' : 'Forfait & Accès'}</span>
              </span>
            </div>

            {/* Stepper Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-teal-400 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          {/* STEP 1: CLINIC IDENTITY & 58 WILAYAS */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {isAr ? '🏥 أنشئ حساب عيادتك الطبية في الجزائر' : '🏥 Créez votre cabinet médical en Algérie'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isAr 
                    ? 'أدخل الاسم الرسمي للعيادة، التخصص، والولاية لبناء بيئتك السحابية المعزولة'
                    : 'Renseignez le nom officiel du cabinet, la spécialité et la wilaya pour configurer votre espace'}
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Clinic Name */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">
                    {isAr ? 'اسم العيادة أو المركز الطبي:' : 'Nom du cabinet ou centre médical :'} <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
                    <input
                      type="text"
                      required
                      value={formData.clinic_name}
                      onChange={handleClinicNameChange}
                      placeholder={isAr ? 'مثال: عيادة الأمل للأرطوفونيا والتخاطب' : 'Ex: Cabinet Médical Spécialisé'}
                      className={`w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                    />
                  </div>
                </div>

                {/* Specialty & 58 Wilayas Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Specialty */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold block">
                      {isAr ? 'التخصص الطبي الأساسي:' : 'Spécialité médicale principale :'} <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Stethoscope className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
                      <select
                        value={formData.specialty}
                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                        className={`w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 text-xs text-white focus:outline-none focus:border-brand-500 transition appearance-none ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                      >
                        <option value="orthophonie">{isAr ? 'أرطوفونيا وتخاطب (Orthophonie)' : 'Orthophonie & Rééducation du Langage'}</option>
                        <option value="psychologie">{isAr ? 'علم النفس العيادي (Psychologie Clinique)' : 'Psychologie Clinique & Thérapie TCC'}</option>
                        <option value="neuro_psychiatrie">{isAr ? 'طب نفسي وطب أعصاب (Psychiatrie)' : 'Psychiatrie & Santé Mentale'}</option>
                        <option value="pluridisciplinaire">{isAr ? 'مركز متعدد التخصصات (Pluridisciplinaire)' : 'Centre Médical Pluridisciplinaire'}</option>
                      </select>
                    </div>
                  </div>

                  {/* 58 Wilayas Selector */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold block">
                      {isAr ? 'الولاية:' : 'Wilaya :'} <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
                      <select
                        value={formData.wilaya_code}
                        onChange={handleWilayaChange}
                        className={`w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 text-xs text-white focus:outline-none focus:border-brand-500 transition appearance-none ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                      >
                        {ALGERIAN_WILAYAS_58.map((w) => (
                          <option key={w.code} value={w.code}>
                            {w.code} - {isAr ? `${w.nameAr} (${w.nameFr})` : `${w.nameFr} (${w.nameAr})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Subdomain Customization with Live Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold block">
                      {isAr ? 'النطاق الفرعي السحابي للعيادة (Subdomain):' : 'Sous-domaine cloud du cabinet (Subdomain) :'} <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-brand-400 font-mono">
                      {isAr ? 'رابطك الخاص للدخول وبوابة الأولياء' : 'Votre lien exclusif d\'accès et portail famille'}
                    </span>
                  </div>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5 focus-within:border-brand-500 transition" dir="ltr">
                    <span className="text-xs text-brand-400 font-mono font-bold">https://</span>
                    <input
                      type="text"
                      required
                      value={formData.subdomain}
                      onChange={(e) => setFormData({ ...formData, subdomain: slugify(e.target.value) })}
                      placeholder="cabinet-el-amel"
                      className="bg-transparent border-none text-xs text-white placeholder-slate-600 focus:outline-none font-mono font-bold px-1 w-full"
                    />
                    <span className="text-xs text-slate-500 font-mono">.psypro.tech</span>
                  </div>
                </div>

                {/* Clinic Phone */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">
                    {isAr ? 'هاتف الاستقبال للعيادة (اختياري):' : 'Téléphone d\'accueil du cabinet (Optionnel) :'}
                  </label>
                  <div className="relative">
                    <Phone className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
                    <input
                      type="tel"
                      value={formData.clinic_phone}
                      onChange={(e) => setFormData({ ...formData, clinic_phone: e.target.value })}
                      placeholder="0550 11 22 33"
                      className={`w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition font-mono ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Link to="/" className="text-xs text-slate-400 hover:text-white transition">
                  {isAr ? 'العودة للرئيسية' : 'Retour à l\'accueil'}
                </Link>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-teal-500 text-white font-black text-xs shadow-lg shadow-brand-500/25 hover:scale-[1.02] transition flex items-center gap-2"
                >
                  <span>{isAr ? 'المتابعة إلى بيانات الطبيب' : 'Continuer vers les coordonnées du praticien'}</span>
                  {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PRACTITIONER / DOCTOR INFO */}
          {step === 2 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {isAr ? '👨‍⚕️ بيانات الطبيب أو الأخصائي المسؤول' : '👨‍⚕️ Coordonnées du praticien responsable'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isAr 
                    ? 'تُستخدم هذه البيانات لإدارة الحساب وإصدار التقارير الطبية الرسمية (Bilan)'
                    : 'Ces informations serviront à l\'administration et à l\'entête des bilans officiels'}
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Doctor Name */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">
                    {isAr ? 'الاسم واللقب الكامل:' : 'Nom et prénom complet :'} <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
                    <input
                      type="text"
                      required
                      value={formData.owner_name}
                      onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                      placeholder={isAr ? 'مثال: د. أمينة بن علي' : 'Ex: Dr. Amina Benali'}
                      className={`w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                    />
                  </div>
                </div>

                {/* Professional License Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold block">
                      {isAr ? 'رقم الاعتماد أو الرخصة المهنية (اختياري):' : 'N° d\'agrément ou licence professionnelle (Optionnel) :'}
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {isAr ? 'يظهر في ترويسة التقارير الرسمية' : 'Apparaît sur l\'entête des bilans'}
                    </span>
                  </div>
                  <div className="relative">
                    <Award className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
                    <input
                      type="text"
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      placeholder="DZ-MSPRH-2026-884"
                      className={`w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition font-mono ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                    />
                  </div>
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold block">
                      {isAr ? 'البريد الإلكتروني المهني:' : 'Adresse email professionnelle :'} <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
                      <input
                        type="email"
                        required
                        autoComplete="username"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="doctor@clinic.dz"
                        className={`w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition font-mono ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold block">
                      {isAr ? 'رقم الهاتف المباشر (للواتساب والإشعارات):' : 'Numéro de téléphone direct (WhatsApp) :'} <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0550 11 22 33"
                        className={`w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition font-mono ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Password with Strength Meter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold block">
                      {isAr ? 'كلمة مرور الحساب:' : 'Mot de passe du compte :'} <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {isAr ? 'قوة كلمة المرور:' : 'Force du mot de passe :'}{' '}
                      <span className={`font-bold ${
                        passStrength >= 3 ? 'text-emerald-400' : passStrength === 2 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {passStrength >= 3 
                          ? (isAr ? 'قوية جداً 🔒' : 'Très fort 🔒') 
                          : passStrength === 2 
                          ? (isAr ? 'متوسطة' : 'Moyen') 
                          : (isAr ? 'ضعيفة' : 'Faible')}
                      </span>
                    </span>
                  </div>

                  <div className="relative">
                    <Lock className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••••••"
                      className={`w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition font-mono ${isAr ? 'pr-10 pl-11' : 'pl-10 pr-11'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 ${isAr ? 'left-3.5' : 'right-3.5'}`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Visual Bar */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`h-1 rounded-full transition-colors duration-300 ${
                          passStrength >= bar
                            ? passStrength >= 3
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition text-xs font-bold flex items-center gap-1.5"
                >
                  {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                  <span>{isAr ? 'السابق' : 'Précédent'}</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-teal-500 text-white font-black text-xs shadow-lg shadow-brand-500/25 hover:scale-[1.02] transition flex items-center gap-2"
                >
                  <span>{isAr ? 'المتابعة إلى اختيار الخطة' : 'Continuer vers le choix du forfait'}</span>
                  {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: PLAN SELECTION & LAUNCH */}
          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {isAr ? '✨ تفعيل الفترة التجريبية (14 يوماً مجاناً)' : '✨ Activation de l\'essai gratuit (14 jours)'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isAr 
                    ? 'اختر الباقة المناسبة لحجم عيادتك. لن يُطلب منك أي دفع أو بطاقة بنكية خلال فترة التجربة'
                    : 'Sélectionnez le forfait adapté à votre activité. Aucun paiement ni carte bancaire requis.'}
                </p>
              </div>

              {/* Plan Cards Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                {registrationPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setFormData({ ...formData, selected_plan: plan.id })}
                    className={`p-4 rounded-2xl border cursor-pointer transition relative space-y-2.5 flex flex-col justify-between ${
                      formData.selected_plan === plan.id
                        ? 'bg-gradient-to-b from-slate-900 to-indigo-950/50 border-brand-500 shadow-xl shadow-brand-500/15 ring-1 ring-brand-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-brand-400">{plan.badge}</span>
                        {formData.selected_plan === plan.id && (
                          <CheckCircle2 className="w-4 h-4 text-brand-400" />
                        )}
                      </div>
                      <h3 className="font-bold text-white text-sm">{plan.name}</h3>
                      <div className="font-black text-sm text-emerald-400 font-mono">
                        {plan.price}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {isAr ? `يعادل ${plan.monthly}` : `Équivaut à ${plan.monthly}`}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                        {plan.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-bold">
                      <span className={formData.selected_plan === plan.id ? 'text-brand-400' : 'text-slate-500'}>
                        {plan.id === formData.selected_plan 
                          ? (isAr ? '✓ الباقة المحددة للتجربة' : '✓ Forfait sélectionné') 
                          : (isAr ? 'انقر لاختيار هذه الخطة' : 'Cliquer pour choisir')}
                      </span>
                      {plan.popular && (
                        <span className="text-amber-400 text-[10px]">
                          {isAr ? '⭐ خيار مميز' : '⭐ Recommandé'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sample Data Toggle */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-0.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                    <span className="font-bold text-white">
                      {isAr ? 'تهيئة بيانات تجريبية سريرية جاهزة (موصى به)' : 'Pré-remplir avec des données cliniques types (Recommandé)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isAr 
                      ? 'إنشاء مرضى تجريبيين ومقاييس سابقة جاهزة لتجربة المنصة فوراً وتصدير أول Bilan بنقرة واحدة'
                      : 'Crée des dossiers patients et bilans de test pour essayer immédiatement la plateforme'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.seed_sample_data}
                  onChange={(e) => setFormData({ ...formData, seed_sample_data: e.target.checked })}
                  className="w-5 h-5 accent-brand-500 rounded cursor-pointer shrink-0"
                />
              </div>

              {/* Promo Code Input */}
              <div className="space-y-1.5 text-xs">
                <label className="text-slate-400 font-bold block">
                  {isAr ? 'كود ترويجي أو رمز الإحالة (اختياري):' : 'Code promo ou parrainage (Optionnel) :'}
                </label>
                <div className="relative">
                  <Gift className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
                  <input
                    type="text"
                    value={formData.promo_code}
                    onChange={(e) => setFormData({ ...formData, promo_code: e.target.value.toUpperCase() })}
                    placeholder="DZ-ORTHO-2026"
                    className={`w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition font-mono uppercase ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                  />
                </div>
              </div>

              {/* Trust & Guarantee Badge */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="leading-relaxed text-[11px]">
                  {isAr 
                    ? 'ضمان تجربة مجانية كاملة لمدة 14 يوماً مع كافة الصلاحيات • سداد لاحق ميسر عبر بريدي موب BaridiMob أو CCP.'
                    : 'Essai gratuit 14 jours sans engagement • Règlement ultérieur simplifié via BaridiMob ou virement CCP.'}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                  <span>{isAr ? 'السابق' : 'Précédent'}</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-black text-xs shadow-xl shadow-brand-500/30 hover:scale-[1.02] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isAr ? 'جاري إطلاق عيادتك السحابية...' : 'Initialisation de votre cabinet...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isAr ? 'إطلاق العيادة وبدء التجربة المجانية 🚀' : 'Créer et activer la clinique maintenant 🚀'}</span>
                      {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="p-6 border-t border-slate-800/80 text-center text-[11px] text-slate-500 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
        <div>
          {isAr 
            ? 'منصة عيادتي السحابية PsyPro SaaS • حماية تامة للسر المهني وتشفير طبي AES-256'
            : 'Plateforme PsyPro SaaS DZ • Confidentialité médicale & Chiffrement E2EE AES-256'}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-slate-400 hover:text-white">{isAr ? 'الرئيسية' : 'Accueil'}</Link>
          <span>•</span>
          <Link to="/directory" className="text-slate-400 hover:text-white">{isAr ? 'دليل العيادات (58 ولاية)' : 'Annuaire (58 Wilayas)'}</Link>
          <span>•</span>
          <Link to={isAr ? "/login" : "/login?lang=fr"} className="text-slate-400 hover:text-white">{isAr ? 'تسجيل الدخول' : 'Connexion'}</Link>
        </div>
      </footer>

    </div>
  );
}
