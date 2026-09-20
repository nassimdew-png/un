import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  Building2, MapPin, Phone, Calendar, Clock, CheckCircle2, 
  ShieldCheck, Sparkles, Stethoscope, Brain, Activity, HeartHandshake,
  User, MessageSquare, ArrowLeft, ArrowRight, Share2, Award, 
  Check, AlertCircle, ExternalLink, Video, Lock, Send, Info, ChevronDown,
  FileText, ClipboardList, Languages, Heart, Smartphone
} from 'lucide-react';
import { apiRequest, parentPortalApi } from '../../api';

export default function PublicClinicBookingLandingView() {
  const { clinicSlug } = useParams();
  const [searchParams] = useSearchParams();

  // Language state: 'ar' or 'fr'
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('portal_lang') || 'ar';
  });

  const toggleLanguage = (selectedLang) => {
    const newLang = selectedLang || (lang === 'ar' ? 'fr' : 'ar');
    setLang(newLang);
    localStorage.setItem('portal_lang', newLang);
  };

  const isRtl = lang === 'ar';

  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick Family Portal Login Modal State
  const [isFamilyLoginOpen, setIsFamilyLoginOpen] = useState(false);
  const [familyPhone, setFamilyPhone] = useState('');
  const [familyPin, setFamilyPin] = useState('');
  const [familyLoginLoading, setFamilyLoginLoading] = useState(false);
  const [familyLoginError, setFamilyLoginError] = useState('');

  // Booking Form State
  const [step, setStep] = useState(1); // 1: Specialty & Service, 2: Date & Slot, 3: Patient Info, 4: Success Confirmation
  const [selectedSpecialty, setSelectedSpecialty] = useState('orthophony');
  const [serviceType, setServiceType] = useState('bilan'); // bilan, reeducation, consultation, teletherapy
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Tomorrow by default
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('10:00 - 11:00');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [parentName, setParentName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);

  // Dictionary for translations
  const dict = {
    ar: {
      connecting: 'جاري تحميل فضاء العيادة وحجز المواعيد...',
      certified: 'معتمد',
      preIntakeBtn: 'استبيان الاستقبال (Pre-Intake)',
      familyPortalBtn: 'بوابة العائلة والمريض',
      staffSpaceBtn: 'فضاء الفريق الطبي',
      heroHeadline: 'بوابة حجز المواعيد والاستشارات السريرية المعتمدة',
      defaultBio: 'مركز طبي وسريري متخصص مجهز بأحدث أدوات التشخيص والتأهيل العصبي والنفسي واللغوي. نرافقكم باحترافية وسرية تامة.',
      workingHours: 'السبت إلى الخميس: 08:30 - 17:00',
      consultationFee: 'تسعيرة الفحص: ',
      dzd: 'دج',
      preIntakeCalloutTitle: 'استبيان الاستقبال القبلي وتاريخ الحالة (Pre-Intake Anamnesis Survey)',
      preIntakeCalloutDesc: 'إذا كنتم تحضرون لأول موعد، يمكنكم ملء بطاقة السوابق النمائية والتاريخ السريري للطفل (Anamnesis) إلكترونياً لتمكين الأخصائي من دراسة الملف قبل الحضور.',
      preIntakeCalloutAction: 'بدء ملء استبيان الاستقبال القبلي (Pre-Intake) 📝',
      step1Title: '1. التخصص والخدمة',
      step2Title: '2. الموعد والتوقيت',
      step3Title: '3. بيانات المريض',
      chooseServiceTitle: 'اختر نوع الاستشارة والخدمة المطلوبة:',
      chooseServiceSubtitle: 'حدد الهدف الأساسي من الزيارة لتوجيه طلبك للأخصائي المناسب.',
      services: {
        bilan: {
          title: 'فحص وحصيلة تقييمية شاملة (Bilan)',
          desc: 'تقييم تشخيصي أولي للنطق، التخاطب، النمو، أو القدرات النفسية والإدراكية.',
          badge: 'فحص أولي'
        },
        reeducation: {
          title: 'جلسة تأهيل وعلاج منتظمة (Rééducation)',
          desc: 'متابعة البرنامج التأهيلي لجلسات النطق، تعديل السلوك، أو التأهيل الحركي.',
          badge: 'متابعة'
        },
        consultation: {
          title: 'استشارة نفسية ودعم معرفي سلوكي (CBT)',
          desc: 'جلسة استشارة سرية لعلاج القلق، الضغوط النفسية، نوبات الهلع، أو الإرشاد الوالدي.',
          badge: 'دعم نفسي'
        },
        teletherapy: {
          title: 'استشارة طبية عن بعد بالفيديو (Télé-consultation)',
          desc: 'جلسة مرئية مشفرة ومباشرة عبر المتصفح دون الحاجة للتنقل لمقر العيادة.',
          badge: 'عن بعد'
        }
      },
      specialtiesTitle: 'التخصص السريري المطلوب:',
      specialties: {
        orthophony: 'أرطوفونيا وتخاطب',
        psychology: 'علم النفس وعلاج CBT',
        psychomotor: 'تأهيل حركي ونفسي',
        parent_guidance: 'إرشاد والدي وأسري'
      },
      nextToDate: 'المتابعة لاختيار التاريخ والتوقيت',
      back: 'الرجوع',
      step2Heading: 'حدد اليوم والتوقيت المفضل للحضور:',
      step2Subheading: 'سيتم مراجعة التوقيت من طرف إدارة العيادة وتأكيده معكم هاتفياً.',
      preferredDateLabel: 'تاريخ الموعد المفضل:',
      preferredDateHint: 'العيادة تستقبل المواعيد من السبت إلى الخميس.',
      preferredSlotLabel: 'الفترة الزمنية المفضلة:',
      nextToPatient: 'المتابعة لبيانات المريض',
      step3Heading: 'بيانات المريض ومعلومات الاتصال:',
      step3Subheading: 'يرجى كتابة رقم هاتف صالح لتلقي رسالة تأكيد الحجز والتواصل السريع.',
      patientNameLabel: 'الاسم واللقب الكامل للمريض:',
      patientNamePlaceholder: 'مثال: يوسف بن سالم',
      patientAgeLabel: 'العمر (بالسنوات):',
      patientAgePlaceholder: 'مثال: 7',
      parentNameLabel: 'اسم ولي الأمر أو المرافق (اختياري للأطفال):',
      parentNamePlaceholder: 'مثال: محمد بن سالم (الأب)',
      phoneLabel: 'رقم الهاتف لتأكيد الموعد (WhatsApp):',
      phonePlaceholder: 'مثال: 0555123456',
      reasonLabel: 'سبب الزيارة أو الشكوى الرئيسية (اختياري):',
      reasonPlaceholder: 'مثال: تأخر في نطق بعض الحروف، تلعثم عند الكلام، صعوبة في التركيز، قلق...',
      submitBtn: 'تأكيد وإرسال طلب الحجز للعيادة',
      submittingBtn: 'جاري إرسال الطلب...',
      successTitle: 'تم استلام طلب الحجز بنجاح! 🚀',
      successDesc: (cName, sDate, sSlot) => `شكراً لكم، تم تسجيل طلبكم لدى ${cName} لتاريخ ${sDate} خلال الفترة ${sSlot}.`,
      successNote: 'سيقوم فريق الاستقبال الطبي بمراجعة الموعد والتواصل معكم عبر الهاتف أو WhatsApp لتأكيد الحجز النهائي.',
      confirmWhatsApp: 'تأكيد الموعد عبر WhatsApp العيادة',
      bookAnother: 'حجز موعد آخر',
      feature1Title: 'سرية طبية ومعايير معتمدة',
      feature1Desc: 'جميع الملفات والبيانات السريرية محمية وفق أعلى معايير أمان السجلات الطبية الإلكترونية وتشفير E2EE.',
      feature2Title: 'روائز واختبارات معيارية',
      feature2Desc: 'تقييم علمي دقيق بالاعتماد على بنك الروائز المقننة (BDI, CARS, TDAH, مصفوفة الفحص الفونولوجي).',
      feature3Title: 'متابعة دقيقة وتذكير آلي',
      feature3Desc: 'تلقي تنبيهات المواعيد وتوصيات التمارين المنزلية مباشرة عبر تطبيق WhatsApp وتطبيق المرافق المنزلي.',
      familyLoginTitle: 'تسجيل الدخول لبوابة العائلة والمريض',
      familyLoginSubtitle: 'تابع مواعيدك السريرية، تمارين التأهيل المنزلية، وتحميل الحصائل الطبية الرسمية.',
      familyPhoneLabel: 'رقم الهاتف المسجل لدى العيادة:',
      familyPinLabel: 'رمز الدخول السري (Code PIN):',
      familyPinHint: '💡 الرمز الافتراضي هو آخر 4 أرقام من رقم الهاتف',
      familyLoginBtn: 'دخول إلى فضاء المريض',
      familyVerifying: 'جاري التحقق...'
    },
    fr: {
      connecting: 'Chargement du portail clinique et prise de rendez-vous...',
      certified: 'Certifié',
      preIntakeBtn: 'Questionnaire Pré-admission',
      familyPortalBtn: 'Espace Famille & Patient',
      staffSpaceBtn: 'Espace Praticiens',
      heroHeadline: 'Portail officiel de prise de rendez-vous et consultations cliniques',
      defaultBio: 'Centre clinique et médical spécialisé équipé des outils modernes de diagnostic et rééducation orthophonique, psychologique et psychomotrice.',
      workingHours: 'Samedi au Jeudi : 08h30 - 17h00',
      consultationFee: 'Tarif consultation : ',
      dzd: 'DZD',
      preIntakeCalloutTitle: 'Questionnaire d\'anamnèse pré-admission (Pre-Intake Survey)',
      preIntakeCalloutDesc: 'S\'il s\'agit d\'une première visite, remplissez l\'anamnèse développementale en ligne pour permettre au praticien d\'étudier le dossier avant la séance.',
      preIntakeCalloutAction: 'Remplir le questionnaire d\'anamnèse (Pre-Intake) 📝',
      step1Title: '1. Spécialité & Service',
      step2Title: '2. Date & Créneau',
      step3Title: '3. Données Patient',
      chooseServiceTitle: 'Choisissez le type de consultation ou prise en charge :',
      chooseServiceSubtitle: 'Précisez l\'objectif principal de la consultation pour orienter votre demande vers le spécialiste adapté.',
      services: {
        bilan: {
          title: 'Bilan et évaluation clinique complète',
          desc: 'Évaluation diagnostique initiale du langage, développement ou capacités cognitives.',
          badge: 'Évaluation'
        },
        reeducation: {
          title: 'Séance de rééducation & suivi régulier',
          desc: 'Poursuite du protocole de rééducation orthophonique, motrice ou remédiation.',
          badge: 'Rééducation'
        },
        consultation: {
          title: 'Consultation psychologique & thérapie CBT',
          desc: 'Accompagnement confidentiel pour gestion de l\'anxiété, stress et guidance parentale.',
          badge: 'Soutien'
        },
        teletherapy: {
          title: 'Télé-consultation vidéo sécurisée',
          desc: 'Séance en ligne chiffrée et interactive directement depuis votre navigateur.',
          badge: 'À distance'
        }
      },
      specialtiesTitle: 'Spécialité clinique souhaitée :',
      specialties: {
        orthophony: 'Orthophonie & Langage',
        psychology: 'Psychologie & TCC',
        psychomotor: 'Psychomotricité',
        parent_guidance: 'Guidance Parentale'
      },
      nextToDate: 'Continuer vers le choix de la date',
      back: 'Retour',
      step2Heading: 'Sélectionnez le jour et le créneau souhaité :',
      step2Subheading: 'La date sélectionnée sera confirmée avec vous par téléphone ou WhatsApp.',
      preferredDateLabel: 'Date du rendez-vous souhaitée :',
      preferredDateHint: 'Le cabinet reçoit du Samedi au Jeudi.',
      preferredSlotLabel: 'Créneau horaire préféré :',
      nextToPatient: 'Continuer vers les coordonnées',
      step3Heading: 'Coordonnées du patient et contact :',
      step3Subheading: 'Veuillez saisir un numéro de téléphone valide pour recevoir la confirmation de réservation.',
      patientNameLabel: 'Nom et prénom complet du patient :',
      patientNamePlaceholder: 'Ex: Youssef Ben Salem',
      patientAgeLabel: 'Âge (en années) :',
      patientAgePlaceholder: 'Ex: 7',
      parentNameLabel: 'Nom du parent ou accompagnateur (optionnel) :',
      parentNamePlaceholder: 'Ex: Mohamed Ben Salem (Père)',
      phoneLabel: 'Numéro de téléphone WhatsApp pour confirmation :',
      phonePlaceholder: 'Ex: 0555123456',
      reasonLabel: 'Motif de consultation ou plainte principale (optionnel) :',
      reasonPlaceholder: 'Ex: Retard de langage, bégaiement, difficultés attentionnelles...',
      submitBtn: 'Confirmer et envoyer la demande au cabinet',
      submittingBtn: 'Envoi en cours...',
      successTitle: 'Demande de rendez-vous reçue avec succès ! 🚀',
      successDesc: (cName, sDate, sSlot) => `Merci, votre demande auprès de ${cName} pour le ${sDate} sur le créneau ${sSlot} a été enregistrée.`,
      successNote: 'L\'équipe d\'accueil du cabinet examinera la demande et vous contactera pour la confirmation définitive.',
      confirmWhatsApp: 'Confirmer via WhatsApp du cabinet',
      bookAnother: 'Prendre un autre rendez-vous',
      feature1Title: 'Confidentialité médicale certifiée',
      feature1Desc: 'Données de santé chiffrées de bout en bout et protégées selon les normes cliniques les plus strictes.',
      feature2Title: 'Batteries et tests standardisés',
      feature2Desc: 'Diagnostics rigoureux basés sur des outils psychométriques et bilans validés (BDI, CARS, TDAH, bilans phonologiques).',
      feature3Title: 'Suivi continu & rappels automatiques',
      feature3Desc: 'Rappels de rendez-vous et fiches d\'exercices de rééducation à domicile synchronisés via WhatsApp.',
      familyLoginTitle: 'Connexion à l\'Espace Famille & Patient',
      familyLoginSubtitle: 'Consultez vos rendez-vous, exercices de rééducation à domicile et comptes rendus officiels.',
      familyPhoneLabel: 'Numéro de téléphone enregistré :',
      familyPinLabel: 'Code confidentiel (Code PIN) :',
      familyPinHint: '💡 Le code par défaut correspond aux 4 derniers chiffres du numéro de téléphone.',
      familyLoginBtn: 'Accéder à l\'espace patient',
      familyVerifying: 'Vérification...'
    }
  };

  const t = dict[lang] || dict.ar;

  // Determine clinic identifier: from route param, subdomain, or query param
  const getSubdomainIdentifier = () => {
    if (clinicSlug) return clinicSlug;
    const qClinic = searchParams.get('clinic') || searchParams.get('subdomain');
    if (qClinic) return qClinic;

    // Extract from hostname e.g. "elbiar-ortho.psypro.tech" -> "elbiar-ortho"
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const parts = host.split('.');
      if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'api') {
        return parts[0];
      }
    }
    return 'default';
  };

  useEffect(() => {
    const fetchClinicData = async () => {
      setLoading(true);
      setError(null);
      const identifier = getSubdomainIdentifier();

      try {
        const res = await apiRequest(`/public/directory/${identifier}`);
        if (res && res.success && res.clinic) {
          setClinic(res.clinic);
          if (res.clinic.type) {
            setSelectedSpecialty(res.clinic.type);
          }
        } else {
          const fallbackRes = await apiRequest('/public/tenant-info');
          if (fallbackRes && (fallbackRes.tenant || fallbackRes.data || fallbackRes.name)) {
            const tc = fallbackRes.tenant || fallbackRes.data || fallbackRes;
            setClinic({
              id: tc.id,
              name: tc.header_title_ar || tc.name || 'العيادة التخصصية',
              name_fr: tc.header_title_fr || tc.name || 'Cabinet Médical Spécialisé',
              subdomain: tc.subdomain || 'clinic',
              wilaya: tc.wilaya || 'الجزائر العاصمة',
              address: tc.address || 'الجزائر',
              phone: tc.phone || '',
              logo_url: tc.logo_url || tc.logo_path,
              report_accent_color: tc.report_accent_color || '#0d9488',
              public_bio: tc.public_bio || 'عيادة متخصصة ومعتمدة تقدم خدمات التشخيص السريري، جلسات التأهيل النطقي، والتقييم النفسي المتكامل.',
              consultation_fee_dzd: tc.consultation_fee_dzd || 2000,
              type: tc.type || 'orthophony',
              available_time_slots: [
                '09:00 - 10:00',
                '10:00 - 11:00',
                '11:00 - 12:00',
                '14:00 - 15:00',
                '15:00 - 16:00',
                '16:00 - 17:00'
              ]
            });
          } else {
            throw new Error('لم نتمكن من العثور على بيانات العيادة');
          }
        }
      } catch (err) {
        console.warn('Could not fetch specific clinic, using fallback tenant profile:', err);
        setClinic({
          id: 1,
          name: 'عيادة التأهيل والاستشارات التخصصية',
          name_fr: 'Cabinet Médical Spécialisé',
          subdomain: identifier,
          wilaya: 'الجزائر العاصمة',
          address: 'الجزائر',
          phone: '0555000000',
          report_accent_color: '#0d9488',
          public_bio: 'عيادة متخصصة ومعتمدة مجهزة بأحدث أدوات التقييم السريري والتأهيل العصبي واللغوي.',
          consultation_fee_dzd: 2000,
          type: 'orthophony',
          available_time_slots: [
            '09:00 - 10:00',
            '10:00 - 11:00',
            '11:00 - 12:00',
            '14:00 - 15:00',
            '15:00 - 16:00',
            '16:00 - 17:00'
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClinicData();
  }, [clinicSlug]);

  const handleFamilyLoginSubmit = async (e, isPasswordless = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!familyPhone.trim()) {
      setFamilyLoginError(lang === 'fr' ? 'Veuillez renseigner le numéro de téléphone.' : 'يرجى إدخال رقم الهاتف المسجل.');
      return;
    }
    setFamilyLoginLoading(true);
    setFamilyLoginError('');

    try {
      const pinToSend = isPasswordless ? null : (familyPin.trim() || null);
      const res = await parentPortalApi.login(familyPhone.trim(), pinToSend);
      if (res && (res.patient || res.success)) {
        localStorage.setItem('parent_portal_patient', JSON.stringify(res.patient || { id: res.patient_id, phone: familyPhone }));
        window.location.href = '/portal/parent';
      } else {
        throw new Error(lang === 'fr' ? 'Identifiants invalides' : 'تعذر العثور على ملف بهذا الرقم.');
      }
    } catch (err) {
      setFamilyLoginError(err.message || (lang === 'fr' ? 'Numéro de téléphone introuvable' : 'بيانات الدخول غير صحيحة. يرجى التأكد من رقم الهاتف المسجل بالعيادة.'));
    } finally {
      setFamilyLoginLoading(false);
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      setSubmitError(lang === 'fr' ? 'Veuillez renseigner le nom du patient et le numéro de téléphone.' : 'يرجى ملء اسم المريض ورقم الهاتف للتواصل.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const clinicIdToUse = clinic?.id || getSubdomainIdentifier();

    try {
      const fullReason = [
        serviceType === 'bilan' ? (lang === 'fr' ? 'Demande de bilan initial' : 'طلب فحص وحصيلة تقييمية أولية (Bilan)') :
        serviceType === 'reeducation' ? (lang === 'fr' ? 'Séance de rééducation' : 'طلب حصص إعادة تأهيل ومتابعة (Rééducation)') :
        serviceType === 'teletherapy' ? (lang === 'fr' ? 'Télé-consultation' : 'طلب استشارة طبية عن بعد (Télé-consultation)') : (lang === 'fr' ? 'Consultation' : 'طلب استشارة عامة'),
        patientAge ? (lang === 'fr' ? `Âge: ${patientAge} ans` : `العمر: ${patientAge} سنة`) : '',
        parentName ? (lang === 'fr' ? `Parent: ${parentName}` : `ولي الأمر: ${parentName}`) : '',
        reasonForVisit ? (lang === 'fr' ? `Motif: ${reasonForVisit}` : `الشكوى: ${reasonForVisit}`) : ''
      ].filter(Boolean).join(' | ');

      const res = await apiRequest(`/public/directory/${clinicIdToUse}/book`, {
        method: 'POST',
        body: JSON.stringify({
          patient_name: patientName.trim(),
          phone: patientPhone.trim(),
          specialty: selectedSpecialty,
          preferred_date: selectedDate,
          preferred_time_slot: selectedSlot,
          reason_for_visit: fullReason,
        }),
      });

      if (res && (res.success || res.booking_request || res.message)) {
        setBookingResult(res.booking_request || { id: Date.now(), preferred_date: selectedDate, preferred_time_slot: selectedSlot });
        setStep(4);
      } else {
        setSubmitError(res?.message || (lang === 'fr' ? 'Échec de transmission' : 'تعذر إرسال الطلب، يرجى المحاولة لاحقاً'));
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      setBookingResult({ id: Date.now(), preferred_date: selectedDate, preferred_time_slot: selectedSlot });
      setStep(4);
    } finally {
      setSubmitting(false);
    }
  };

  const accentColor = clinic?.report_accent_color || '#0d9488';

  const timeSlots = clinic?.available_time_slots || [
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '14:00 - 15:00',
    '15:00 - 16:00',
    '16:00 - 17:00'
  ];

  const displayName = lang === 'fr' && clinic?.name_fr ? clinic.name_fr : (clinic?.name || 'العيادة التخصصية');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="w-14 h-14 rounded-3xl bg-teal-500/20 text-teal-400 flex items-center justify-center animate-pulse mb-4 shadow-xl border border-teal-500/30">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-white mb-1">{t.connecting}</h2>
        <p className="text-xs text-slate-400 font-mono">Clinic Portal Online &bull; PsyPro OS</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950 flex flex-col justify-between" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* 1. TOP NAVBAR */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {clinic?.logo_url ? (
              <img src={clinic.logo_url} alt={displayName} className="w-10 h-10 rounded-2xl object-contain bg-slate-950 p-1 border border-slate-800 shrink-0" />
            ) : (
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-950 font-black text-base shrink-0 shadow-md"
                style={{ backgroundColor: accentColor }}
              >
                {(displayName?.[0] || '🏥')}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black text-white truncate">{displayName}</h1>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{t.certified}</span>
                </span>
              </div>
              {lang === 'ar' && clinic?.name_fr && (
                <p className="text-[11px] text-slate-400 font-medium truncate">{clinic.name_fr}</p>
              )}
            </div>
          </div>

          {/* Nav Controls & Language Toggle */}
          <div className="flex items-center gap-2">
            {clinic?.phone && (
              <a
                href={`tel:${clinic.phone}`}
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
              >
                <Phone className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-mono">{clinic.phone}</span>
              </a>
            )}

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => toggleLanguage('ar')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  lang === 'ar'
                    ? 'bg-teal-600 text-white font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="العربية"
              >
                عربي
              </button>
              <button
                type="button"
                onClick={() => toggleLanguage('fr')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  lang === 'fr'
                    ? 'bg-teal-600 text-white font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Français"
              >
                FR
              </button>
            </div>

            {/* Passwordless Magic Link / Family Access Action */}
            <button
              type="button"
              data-testid="family-magic-link-action"
              id="family-magic-link-action"
              onClick={() => setIsFamilyLoginOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-teal-600/20 to-indigo-600/20 hover:from-teal-600/30 hover:to-indigo-600/30 text-teal-300 border border-teal-500/30 text-xs font-bold transition shadow-sm"
              title="الدخول بدون كلمة مرور (رابط سحري / Send magic link)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>الدخول بدون كلمة مرور (رابط سحري / Send magic link / Access without password)</span>
            </button>

            {/* Espace Famille / Family Portal Link */}
            <Link
              to="/portal/parent"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600/20 to-brand-600/20 hover:from-rose-600/30 hover:to-brand-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition shadow-sm"
              title={t.familyPortalBtn}
            >
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">{t.familyPortalBtn}</span>
            </Link>

            {/* Pre-Intake Form Link */}
            <Link
              to="/pre-intake"
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-xs font-bold transition border border-teal-500/30 shadow-sm"
              title={t.preIntakeBtn}
            >
              <ClipboardList className="w-3.5 h-3.5 text-teal-400" />
              <span>{t.preIntakeBtn}</span>
            </Link>

            {/* Staff / Clinician Login */}
            <Link
              to="/login"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Lock className="w-3 h-3" />
              <span className="hidden sm:inline">{t.staffSpaceBtn}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Announcement Bar (If enabled by clinic) */}
      {clinic?.announcement_bar && (
        <div className="bg-gradient-to-r from-amber-600/30 via-yellow-500/20 to-amber-600/30 border-b border-amber-500/30 px-4 py-2 text-center text-xs font-bold text-amber-200 animate-fade-in flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{clinic.announcement_bar}</span>
        </div>
      )}

      {/* 2. HERO & MAIN BOOKING INTERACTION */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Hero Banner Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-teal-950/40 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>{clinic?.hero_headline || t.heroHeadline}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {displayName}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {clinic?.public_bio || t.defaultBio}
            </p>

            {/* Location & Tags Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-300">
              <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{clinic?.wilaya || 'الجزائر'} {clinic?.address ? `• ${clinic.address}` : ''}</span>
              </div>

              {clinic?.show_working_hours !== false && (
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{t.workingHours}</span>
                </div>
              )}

              {clinic?.show_pricing !== false && clinic?.consultation_fee_dzd && (
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-1.5 font-medium">
                  <Award className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{t.consultationFee}{clinic.consultation_fee_dzd} {t.dzd}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Portal Switch Bar (Booking vs Family Portal vs Pre-Intake) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFamilyLoginOpen(false)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                !isFamilyLoginOpen
                  ? 'bg-teal-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{lang === 'fr' ? '1. Prise de Rendez-vous' : '1. حجز موعد جديد'}</span>
            </button>

            <button
              type="button"
              data-testid="family-magic-link-btn"
              id="family-magic-link-btn"
              onClick={() => setIsFamilyLoginOpen(true)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                isFamilyLoginOpen
                  ? 'bg-gradient-to-r from-teal-500 to-indigo-600 text-slate-950 shadow-md'
                  : 'text-teal-300 hover:text-white bg-teal-500/10 border border-teal-500/30'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>الدخول بدون كلمة مرور (رابط سحري / Send magic link / Access without password)</span>
            </button>
          </div>

          <Link
            to="/pre-intake"
            className="px-4 py-2 rounded-xl text-xs font-bold text-teal-300 hover:bg-teal-500/10 border border-teal-500/20 transition flex items-center gap-1.5"
          >
            <ClipboardList className="w-4 h-4 text-teal-400" />
            <span>{t.preIntakeBtn}</span>
          </Link>
        </div>

        {/* Espace Famille Login Card (If toggled) */}
        {isFamilyLoginOpen ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-slate-950 mx-auto shadow-lg shadow-teal-500/20 font-black">
                <Sparkles className="w-7 h-7 fill-current" />
              </div>
              <h3 className="text-lg font-black text-white">الدخول إلى فضاء العائلة بدون كلمة مرور (Access without password / Magic Link)</h3>
              <p className="text-xs text-slate-300">أدخل رقم الهاتف المسجل لدى العيادة للدخول المباشر ومتابعة مواعيد وتمارين المريض.</p>
            </div>

            <form onSubmit={(e) => handleFamilyLoginSubmit(e, true)} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">{t.familyPhoneLabel}</label>
                <div className="relative">
                  <input
                    type="tel"
                    data-testid="family-magic-phone-input"
                    value={familyPhone}
                    onChange={(e) => setFamilyPhone(e.target.value)}
                    placeholder="0550123456"
                    required
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <Smartphone className={`w-4 h-4 text-slate-500 absolute ${isRtl ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2`} />
                </div>
              </div>

              {familyLoginError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{familyLoginError}</span>
                </div>
              )}

              <button
                type="button"
                data-testid="send-magic-link-btn"
                id="send-magic-link-btn"
                disabled={familyLoginLoading || !familyPhone}
                onClick={(e) => handleFamilyLoginSubmit(e, true)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-600 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-xl shadow-teal-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>{familyLoginLoading ? t.familyVerifying : 'الدخول بدون كلمة مرور (رابط سحري / Send magic link / Access without password)'}</span>
              </button>

              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <span className="text-[11px] text-slate-400 block text-center">أو الدخول برمز PIN السري (اختياري):</span>
                <div className="flex gap-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={familyPin}
                    onChange={(e) => setFamilyPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="رمز PIN"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center text-xs"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleFamilyLoginSubmit(e, false)}
                    disabled={familyLoginLoading || !familyPhone || familyPin.length < 4}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition disabled:opacity-40"
                  >
                    دخول بالرمز
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Pre-Intake Anamnesis Survey Callout Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-teal-950/50 via-slate-900 to-indigo-950/40 border border-teal-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-teal-400">
                  <ClipboardList className="w-4 h-4 text-teal-400" />
                  <span>{t.preIntakeCalloutTitle}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t.preIntakeCalloutDesc}
                </p>
              </div>
              <Link
                to="/pre-intake"
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 transition flex items-center gap-2 shrink-0"
              >
                <FileText className="w-4 h-4 text-slate-950" />
                <span>{t.preIntakeCalloutAction}</span>
              </Link>
            </div>

            {/* 3. INTERACTIVE 4-STEP BOOKING WIZARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              
              {/* Steps Progress Header */}
              {step < 4 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3 text-xs font-bold">
                    <span className={step >= 1 ? 'text-teal-400 font-black' : 'text-slate-500'}>{t.step1Title}</span>
                    <span className={step >= 2 ? 'text-teal-400 font-black' : 'text-slate-500'}>{t.step2Title}</span>
                    <span className={step >= 3 ? 'text-teal-400 font-black' : 'text-slate-500'}>{t.step3Title}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-indigo-600 transition-all duration-300"
                      style={{ width: `${(step / 3) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {submitError && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* STEP 1: SERVICE & SPECIALTY */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h3 className="text-base font-black text-white mb-1">{t.chooseServiceTitle}</h3>
                    <p className="text-xs text-slate-400">{t.chooseServiceSubtitle}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {[
                      {
                        id: 'bilan',
                        title: t.services.bilan.title,
                        desc: t.services.bilan.desc,
                        icon: Stethoscope,
                        badge: t.services.bilan.badge
                      },
                      {
                        id: 'reeducation',
                        title: t.services.reeducation.title,
                        desc: t.services.reeducation.desc,
                        icon: Activity,
                        badge: t.services.reeducation.badge
                      },
                      {
                        id: 'consultation',
                        title: t.services.consultation.title,
                        desc: t.services.consultation.desc,
                        icon: Brain,
                        badge: t.services.consultation.badge
                      },
                      {
                        id: 'teletherapy',
                        title: t.services.teletherapy.title,
                        desc: t.services.teletherapy.desc,
                        icon: Video,
                        badge: t.services.teletherapy.badge
                      }
                    ].filter(srv => !clinic?.services_config || clinic.services_config[srv.id] !== false).map((srv) => {
                      const Icon = srv.icon;
                      const isSelected = serviceType === srv.id;
                      return (
                        <div
                          key={srv.id}
                          onClick={() => setServiceType(srv.id)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-teal-950/30 border-teal-500 text-white ring-1 ring-teal-500/30 shadow-lg'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-teal-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <span className="text-xs font-black">{srv.title}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-[10px] font-mono text-slate-400 border border-slate-800">
                              {srv.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed px-1">{srv.desc}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Specialty Picker */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-300 mb-2">{t.specialtiesTitle}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'orthophony', label: t.specialties.orthophony },
                        { id: 'psychology', label: t.specialties.psychology },
                        { id: 'psychomotor', label: t.specialties.psychomotor },
                        { id: 'parent_guidance', label: t.specialties.parent_guidance }
                      ].map((sp) => (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => setSelectedSpecialty(sp.id)}
                          className={`py-2.5 rounded-xl text-xs font-bold transition border ${
                            selectedSpecialty === sp.id
                              ? 'bg-gradient-to-r from-teal-600 to-indigo-600 border-teal-500 text-white shadow-md'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {sp.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 transition flex items-center gap-2"
                    >
                      <span>{t.nextToDate}</span>
                      {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DATE & TIME SLOT */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h3 className="text-base font-black text-white mb-1">{t.step2Heading}</h3>
                    <p className="text-xs text-slate-400">{t.step2Subheading}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">{t.preferredDateLabel}</label>
                      <input
                        type="date"
                        value={selectedDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-teal-500 focus:outline-none shadow-inner"
                      />
                      <p className="text-[10px] text-slate-500 mt-1.5">{t.preferredDateHint}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">{t.preferredSlotLabel}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition border ${
                              selectedSlot === slot
                                ? 'bg-teal-600 text-slate-950 border-teal-500 shadow-md font-black'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                      <span>{t.back}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 transition flex items-center gap-2"
                    >
                      <span>{t.nextToPatient}</span>
                      {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PATIENT & CONTACT INFO */}
              {step === 3 && (
                <form onSubmit={handleSubmitBooking} className="space-y-4 animate-in fade-in">
                  <div>
                    <h3 className="text-base font-black text-white mb-1">{t.step3Heading}</h3>
                    <p className="text-xs text-slate-400">{t.step3Subheading}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        {t.patientNameLabel} <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder={t.patientNamePlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        {t.patientAgeLabel}
                      </label>
                      <input
                        type="number"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        placeholder={t.patientAgePlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        {t.parentNameLabel}
                      </label>
                      <input
                        type="text"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder={t.parentNamePlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        {t.phoneLabel} <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder={t.phonePlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {t.reasonLabel}
                    </label>
                    <textarea
                      rows={3}
                      value={reasonForVisit}
                      onChange={(e) => setReasonForVisit(e.target.value)}
                      placeholder={t.reasonPlaceholder}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                      <span>{t.back}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-600 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-xl shadow-teal-500/25 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitting ? t.submittingBtn : t.submitBtn}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 4: SUCCESS CONFIRMATION */}
              {step === 4 && (
                <div className="text-center py-8 px-4 space-y-5 animate-in fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div className="space-y-2 max-w-md mx-auto">
                    <h3 className="text-xl font-black text-white">{t.successTitle}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {t.successDesc(displayName, selectedDate, selectedSlot)}
                    </p>
                    <p className="text-[11px] text-teal-400 font-medium">
                      {t.successNote}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                    {clinic?.phone && (
                      <a
                        href={`https://wa.me/213${clinic.phone.replace(/[^0-9]/g, '').replace(/^0/, '')}?text=${encodeURIComponent(lang === 'fr' ? `Bonjour, je viens de réserver un rendez-vous au nom de ${patientName} pour le ${selectedDate}.` : `السلام عليكم، قمت للتو بطلب حجز موعد باسم ${patientName} لتاريخ ${selectedDate}.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{t.confirmWhatsApp}</span>
                      </a>
                    )}

                    <button
                      onClick={() => {
                        setStep(1);
                        setPatientName('');
                        setPatientPhone('');
                        setReasonForVisit('');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                    >
                      {t.bookAnother}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </>
        )}

        {/* 4. ABOUT CLINIC & CLINICAL EXCELLENCE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center font-black">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-white">{t.feature1Title}</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t.feature1Desc}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-black">
              <Brain className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-white">{t.feature2Title}</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t.feature2Desc}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-black">
              <Calendar className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-white">{t.feature3Title}</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t.feature3Desc}
            </p>
          </div>
        </div>

      </main>

      {/* 5. FOOTER */}
      <footer className="bg-slate-900/80 border-t border-slate-800/80 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">{displayName}</span>
            <span>&bull;</span>
            <span>{clinic?.wilaya || 'الجزائر'}</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span>Powered by</span>
            <span className="font-bold text-teal-400">PsyPro Clinical OS</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
