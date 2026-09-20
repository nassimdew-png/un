/**
 * Phone and WhatsApp Number Normalization Utilities for PsyPro
 */

/**
 * Normalizes phone number into international E.164 digits without symbols or spaces (e.g. 213550123456)
 * Handles Algerian local formats (0550..., 06..., 07..., 02..., 03...) and international formats (+213..., 00213...)
 */
export function normalizeWhatsAppPhone(rawPhone) {
  if (!rawPhone) return '';
  let digits = String(rawPhone).replace(/[^0-9]/g, '');
  if (!digits) return '';

  if (digits.startsWith('00213')) {
    digits = digits.substring(2);
  } else if (digits.startsWith('0') && digits.length === 10) {
    digits = '213' + digits.substring(1);
  } else if (digits.length === 9 && ['5', '6', '7', '9', '2', '3', '4'].includes(digits[0])) {
    digits = '213' + digits;
  }
  return digits;
}

/**
 * Formats phone for human-friendly display (e.g. +213 550 12 34 56)
 */
export function formatWhatsAppDisplayPhone(rawPhone) {
  const clean = normalizeWhatsAppPhone(rawPhone);
  if (!clean) return '';
  if (clean.startsWith('213') && clean.length === 12) {
    return `+213 ${clean.substring(3, 5)} ${clean.substring(5, 7)} ${clean.substring(7, 9)} ${clean.substring(9, 11)} ${clean.substring(11, 12)}`;
  }
  return `+${clean}`;
}

/**
 * Builds standard WhatsApp click-to-chat links (wa.me and api.whatsapp.com)
 */
export function buildWhatsAppLinks(rawPhone, text = '') {
  const phone = normalizeWhatsAppPhone(rawPhone);
  const encodedText = encodeURIComponent(text || '');
  return {
    phone,
    encodedText,
    waMeUrl: phone ? `https://wa.me/${phone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`,
    apiWaUrl: phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}` : `https://api.whatsapp.com/send?text=${encodedText}`,
  };
}
