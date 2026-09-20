/**
 * Clinical Helper for Patient Honorifics, Age Adaptation, and Respectful Tone.
 * Ensures adult psychiatric/psychotherapy patients are addressed with medical dignity (الأستاذ/الفاضل)
 * and pediatric patients address parents respectfully (ولي أمر الطفل).
 */

export function getPatientProfileInfo(patient, specialty = null) {
  if (!patient) {
    return {
      isChild: false,
      age: null,
      fullName: 'العميل الفاضل',
      displayName: 'العميل الفاضل',
      honorific: 'الأستاذ(ة)',
      salutation: 'الأستاذ(ة) الفاضل(ة)',
      portalTargetLabel: 'المتابعة السريرية الشخصية',
      guardianGreeting: 'السلام عليكم ورحمة الله،',
    };
  }

  const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.name || 'المريض الكريم';
  const isFemale = patient.gender === 'female' || patient.gender === 'f';

  // Calculate age from birth_date or dob
  let age = null;
  const dob = patient.birth_date || patient.dob;
  if (dob) {
    const birth = new Date(dob);
    if (!isNaN(birth.getTime())) {
      const now = new Date();
      age = Math.floor((now - birth) / (365.25 * 24 * 60 * 60 * 1000));
    }
  }

  // Determine if patient is a child (< 18 years old or has explicit guardian)
  const isChild = (age !== null && age < 18) || (patient.is_child === true) || (Boolean(patient.guardian_name) && (age === null || age < 18));

  if (isChild) {
    const childTitle = isFemale ? 'الطفلة' : 'الطفل';
    return {
      isChild: true,
      age,
      fullName,
      displayName: `${childTitle} ${fullName}`,
      honorific: childTitle,
      salutation: `ولي أمر ${childTitle} (${fullName})`,
      guardianGreeting: `تحية طيبة إلى ولي أمر ${childTitle} (${fullName}) المحترم 🌸`,
      portalTargetLabel: `المتابعة السريرية والتمارين المنزلية لـ ${childTitle} (${fullName})`,
      portalHeadline: `بوابة الولي والمرافق المنزلي (${childTitle} ${fullName})`,
    };
  }

  // Adult patient (e.g. Depression, Anxiety, Adult Orthophony / Neuro)
  const adultTitle = isFemale ? 'الأستاذة الفاضلة' : 'الأستاذ الفاضل';
  return {
    isChild: false,
    age,
    fullName,
    displayName: fullName,
    honorific: isFemale ? 'الأستاذة' : 'الأستاذ',
    salutation: `${adultTitle} ${fullName}`,
    guardianGreeting: `تحية طيبة للأستاذ(ة) ${fullName} المحترم(ة) 🌸`,
    portalTargetLabel: `المتابعة السريرية الشخصية للأستاذ(ة) ${fullName}`,
    portalHeadline: `بوابة المتابعة السريرية الشخصية (${fullName})`,
  };
}
