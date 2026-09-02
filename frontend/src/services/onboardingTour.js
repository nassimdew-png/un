import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { apiRequest } from '../api';

let driverInstance = null;

export const startOnboardingTour = (force = false) => {
  if (!force && localStorage.getItem('tour_dismissed') === 'true') {
    return;
  }

  // Ensure DOM is ready
  setTimeout(() => {
    driverInstance = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: 'rgba(2, 6, 23, 0.85)',
      nextBtnText: 'التالي ➔',
      prevBtnText: 'السابق ⬅️',
      doneBtnText: 'ابدأ العمل الآن 🚀',
      closeBtnText: 'إغلاق ✕',
      onDestroyStarted: () => {
        handleTourCompleted();
        driverInstance.destroy();
      },
      steps: [
        {
          element: '#dashboard-quick-actions',
          popover: {
            title: '🚀 مرحباً بك في مساحة عمل عيادتك!',
            description: 'من هذا الشريط يمكنك فتح ملف مريض جديد، حجز موعد عاجل، أو تسجيل وصول المرضى بنقرة واحدة.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#daily-clinical-pulse',
          popover: {
            title: '👥 قاعة الانتظار الذكية ونبض العيادة اليومي',
            description: 'متابعة تدفق المرضى المتواجدين في قاعة الاستقبال، إمكانية الاستدعاء الصوتي لشاشة الـ TV، والدخول المباشر للجلسة السريرية.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#nav-psychometrics',
          popover: {
            title: '📊 بنك المقاييس والاختبارات المقننة الـ 30+',
            description: 'مكتبة غنية بالاختبارات الأرطوفونية والنفسية المعتمدة (WISC-V, ELO, CARS, Vineland, NEPSY) مع تصحيح وتحليل بياني آلي للدرجات المعيارية.',
            side: 'left',
            align: 'center',
          },
        },
        {
          element: '#ai-copilot-launcher',
          popover: {
            title: '🤖 المساعد السريري الذكي ومحرر الحصائل',
            description: 'توليد تقارير الحصائل الشاملة (Master Bilan A4 PDF)، صياغة المشاريع الفردية PEP في السياق الجزائري، والتدوين الصوتي السريع SOAP.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#nav-branding-settings',
          popover: {
            title: '⚙️ الهوية البصرية والترويسة والختم الطبي',
            description: 'قم برفع شعار عيادتك والختم الرقمي لتظهر تلقائياً في كافة تقارير A4 الرسمية ووصولات الدفع المطبوعة.',
            side: 'left',
            align: 'center',
          },
        },
      ],
    });

    driverInstance.drive();
  }, 400);
};

const handleTourCompleted = async () => {
  localStorage.setItem('tour_dismissed', 'true');
  try {
    await apiRequest('/user/complete-tour', { method: 'POST' });
  } catch (err) {
    console.warn('Failed to save tour completion flag:', err);
  }
};
