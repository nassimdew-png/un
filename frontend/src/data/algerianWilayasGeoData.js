/**
 * Enhanced Algerian Wilayas Geographic and Projection Dataset (58 Wilayas)
 * Contains centroid coordinates, SVG vector canvas positions, and regional clusters.
 */

export const ALGERIAN_REGIONS = [
  { id: 'all', label_ar: 'كافة الأقاليم الوطنية (58 ولاية)', color: 'emerald' },
  { id: 'center', label_ar: 'الشمال والوسط', color: 'indigo' },
  { id: 'east', label_ar: 'الشرق الجزائري', color: 'teal' },
  { id: 'west', label_ar: 'الغرب والوهراني', color: 'amber' },
  { id: 'high_plateaus', label_ar: 'الهضاب العليا', color: 'purple' },
  { id: 'south', label_ar: 'الجنوب الكبير', color: 'rose' },
];

export const ALGERIA_WILAYAS_GEO = [
  { code: '01', name_ar: 'أدرار', name_fr: 'Adrar', region: 'south', lat: 27.8742, lng: -0.2939, x: 425, y: 495, pop: 440000 },
  { code: '02', name_ar: 'الشلف', name_fr: 'Chlef', region: 'center', lat: 36.1652, lng: 1.3345, x: 488, y: 138, pop: 1100000 },
  { code: '03', name_ar: 'الأغواط', name_fr: 'Laghouat', region: 'high_plateaus', lat: 33.8000, lng: 2.8651, x: 547, y: 240, pop: 520000 },
  { code: '04', name_ar: 'أم البواقي', name_fr: 'Oum El Bouaghi', region: 'east', lat: 35.8755, lng: 7.1135, x: 711, y: 151, pop: 650000 },
  { code: '05', name_ar: 'باتنة', name_fr: 'Batna', region: 'east', lat: 35.5559, lng: 6.1741, x: 675, y: 164, pop: 1250000 },
  { code: '06', name_ar: 'بجاية', name_fr: 'Béjaïa', region: 'east', lat: 36.7559, lng: 5.0843, x: 633, y: 112, pop: 980000 },
  { code: '07', name_ar: 'بسكرة', name_fr: 'Biskra', region: 'high_plateaus', lat: 34.8504, lng: 5.7280, x: 658, y: 195, pop: 780000 },
  { code: '08', name_ar: 'بشار', name_fr: 'Béchar', region: 'south', lat: 31.6167, lng: -2.2167, x: 351, y: 334, pop: 310000 },
  { code: '09', name_ar: 'البليدة', name_fr: 'Blida', region: 'center', lat: 36.4700, lng: 2.8300, x: 546, y: 124, pop: 1200000 },
  { code: '10', name_ar: 'البويرة', name_fr: 'Bouira', region: 'center', lat: 36.3749, lng: 3.9020, x: 587, y: 129, pop: 740000 },
  { code: '11', name_ar: 'تمنراست', name_fr: 'Tamanrasset', region: 'south', lat: 22.7850, lng: 5.5228, x: 650, y: 715, pop: 220000 },
  { code: '12', name_ar: 'تبسة', name_fr: 'Tébessa', region: 'east', lat: 35.4042, lng: 8.1242, x: 751, y: 171, pop: 690000 },
  { code: '13', name_ar: 'تلمسان', name_fr: 'Tlemcen', region: 'west', lat: 34.8783, lng: -1.3150, x: 385, y: 194, pop: 1050000 },
  { code: '14', name_ar: 'تيارت', name_fr: 'Tiaret', region: 'high_plateaus', lat: 35.3710, lng: 1.3170, x: 487, y: 172, pop: 880000 },
  { code: '15', name_ar: 'تيزي وزو', name_fr: 'Tizi Ouzou', region: 'center', lat: 36.7118, lng: 4.0459, x: 593, y: 114, pop: 1180000 },
  { code: '16', name_ar: 'الجزائر العاصمة', name_fr: 'Alger', region: 'center', lat: 36.7538, lng: 3.0588, x: 555, y: 112, pop: 3500000 },
  { code: '17', name_ar: 'الجلفة', name_fr: 'Djelfa', region: 'high_plateaus', lat: 34.6728, lng: 3.2630, x: 562, y: 202, pop: 1350000 },
  { code: '18', name_ar: 'جيجل', name_fr: 'Jijel', region: 'east', lat: 36.8206, lng: 5.7667, x: 659, y: 110, pop: 680000 },
  { code: '19', name_ar: 'سطيف', name_fr: 'Sétif', region: 'east', lat: 36.1911, lng: 5.4137, x: 645, y: 137, pop: 1650000 },
  { code: '20', name_ar: 'سعيدة', name_fr: 'Saïda', region: 'west', lat: 34.8303, lng: 0.1517, x: 442, y: 196, pop: 360000 },
  { code: '21', name_ar: 'سكيكدة', name_fr: 'Skikda', region: 'east', lat: 36.8792, lng: 6.9075, x: 703, y: 107, pop: 950000 },
  { code: '22', name_ar: 'سيدي بلعباس', name_fr: 'Sidi Bel Abbès', region: 'west', lat: 35.1899, lng: -0.6308, x: 412, y: 180, pop: 650000 },
  { code: '23', name_ar: 'عنابة', name_fr: 'Annaba', region: 'east', lat: 36.9000, lng: 7.7667, x: 736, y: 106, pop: 720000 },
  { code: '24', name_ar: 'قالمة', name_fr: 'Guelma', region: 'east', lat: 36.4621, lng: 7.4261, x: 723, y: 125, pop: 510000 },
  { code: '25', name_ar: 'قسنطينة', name_fr: 'Constantine', region: 'east', lat: 36.3650, lng: 6.6147, x: 692, y: 129, pop: 1100000 },
  { code: '26', name_ar: 'المدية', name_fr: 'Médéa', region: 'center', lat: 36.2642, lng: 2.7539, x: 543, y: 133, pop: 890000 },
  { code: '27', name_ar: 'مستغانم', name_fr: 'Mostaganem', region: 'west', lat: 35.9312, lng: 0.0892, x: 440, y: 148, pop: 800000 },
  { code: '28', name_ar: 'المسيلة', name_fr: 'M\'Sila', region: 'high_plateaus', lat: 35.7058, lng: 4.5419, x: 612, y: 157, pop: 1100000 },
  { code: '29', name_ar: 'معسكر', name_fr: 'Mascara', region: 'west', lat: 35.3967, lng: 0.1403, x: 442, y: 171, pop: 840000 },
  { code: '30', name_ar: 'ورقلة', name_fr: 'Ouargla', region: 'south', lat: 31.9493, lng: 5.3250, x: 642, y: 320, pop: 620000 },
  { code: '31', name_ar: 'وهران', name_fr: 'Oran', region: 'west', lat: 35.6987, lng: -0.6349, x: 412, y: 158, pop: 1800000 },
  { code: '32', name_ar: 'البيض', name_fr: 'El Bayadh', region: 'high_plateaus', lat: 33.6832, lng: 1.0193, x: 476, y: 245, pop: 300000 },
  { code: '33', name_ar: 'إليزي', name_fr: 'Illizi', region: 'south', lat: 26.4833, lng: 8.4667, x: 764, y: 556, pop: 60000 },
  { code: '34', name_ar: 'برج بوعريريج', name_fr: 'Bordj Bou Arreridj', region: 'high_plateaus', lat: 36.0732, lng: 4.7611, x: 620, y: 142, pop: 700000 },
  { code: '35', name_ar: 'بومرداس', name_fr: 'Boumerdès', region: 'center', lat: 36.7667, lng: 3.4772, x: 571, y: 112, pop: 880000 },
  { code: '36', name_ar: 'الطارف', name_fr: 'El Tarf', region: 'east', lat: 36.7672, lng: 8.3139, x: 758, y: 112, pop: 440000 },
  { code: '37', name_ar: 'تندوف', name_fr: 'Tindouf', region: 'south', lat: 27.6761, lng: -8.1478, x: 121, y: 504, pop: 65000 },
  { code: '38', name_ar: 'تسمسيلت', name_fr: 'Tissemsilt', region: 'high_plateaus', lat: 35.6072, lng: 1.8108, x: 506, y: 162, pop: 320000 },
  { code: '39', name_ar: 'الوادي', name_fr: 'El Oued', region: 'south', lat: 33.3683, lng: 6.8675, x: 702, y: 259, pop: 740000 },
  { code: '40', name_ar: 'خنشلة', name_fr: 'Khenchela', region: 'east', lat: 35.4358, lng: 7.1433, x: 713, y: 170, pop: 420000 },
  { code: '41', name_ar: 'سوق أهراس', name_fr: 'Souk Ahras', region: 'east', lat: 36.2864, lng: 7.9511, x: 744, y: 133, pop: 470000 },
  { code: '42', name_ar: 'تيبازة', name_fr: 'Tipaza', region: 'center', lat: 36.5897, lng: 2.4475, x: 531, y: 119, pop: 650000 },
  { code: '43', name_ar: 'ميلة', name_fr: 'Mila', region: 'east', lat: 36.4503, lng: 6.2644, x: 678, y: 125, pop: 820000 },
  { code: '44', name_ar: 'عين الدفلى', name_fr: 'Aïn Defla', region: 'center', lat: 36.2644, lng: 1.9678, x: 512, y: 133, pop: 830000 },
  { code: '45', name_ar: 'النعامة', name_fr: 'Naâma', region: 'high_plateaus', lat: 33.2667, lng: -0.3167, x: 424, y: 263, pop: 230000 },
  { code: '46', name_ar: 'عين تموشنت', name_fr: 'Aïn Témouchent', region: 'west', lat: 35.2975, lng: -1.1403, x: 392, y: 175, pop: 400000 },
  { code: '47', name_ar: 'غرداية', name_fr: 'Ghardaïa', region: 'south', lat: 32.4909, lng: 3.6736, x: 578, y: 296, pop: 410000 },
  { code: '48', name_ar: 'غليزان', name_fr: 'Relizane', region: 'west', lat: 35.7372, lng: 0.5558, x: 458, y: 156, pop: 790000 },
  { code: '49', name_ar: 'تيميمون', name_fr: 'Timimoun', region: 'south', lat: 29.2639, lng: 0.2311, x: 445, y: 435, pop: 130000 },
  { code: '50', name_ar: 'برج باجي مختار', name_fr: 'Bordj Badji Mokhtar', region: 'south', lat: 21.3278, lng: 0.9542, x: 473, y: 778, pop: 30000 },
  { code: '51', name_ar: 'أولاد جلال', name_fr: 'Ouled Djellal', region: 'high_plateaus', lat: 34.4333, lng: 5.0667, x: 632, y: 213, pop: 180000 },
  { code: '52', name_ar: 'بني عباس', name_fr: 'Béni Abbès', region: 'south', lat: 30.1333, lng: -2.1667, x: 353, y: 398, pop: 55000 },
  { code: '53', name_ar: 'عين صالح', name_fr: 'In Salah', region: 'south', lat: 27.2000, lng: 2.4667, x: 532, y: 524, pop: 60000 },
  { code: '54', name_ar: 'عين قزام', name_fr: 'In Guezzam', region: 'south', lat: 19.5667, lng: 5.7667, x: 659, y: 854, pop: 25000 },
  { code: '55', name_ar: 'تقرت', name_fr: 'Touggourt', region: 'south', lat: 33.1053, lng: 6.0578, x: 671, y: 270, pop: 270000 },
  { code: '56', name_ar: 'جانت', name_fr: 'Djanet', region: 'south', lat: 24.5539, lng: 9.4847, x: 803, y: 639, pop: 25000 },
  { code: '57', name_ar: 'المغير', name_fr: 'El M\'Ghair', region: 'south', lat: 33.9500, lng: 5.9167, x: 665, y: 233, pop: 170000 },
  { code: '58', name_ar: 'المنيعة', name_fr: 'El Meniaa', region: 'south', lat: 30.5833, lng: 2.8833, x: 548, y: 379, pop: 85000 },
];

export function getWilayaGeo(code) {
  const c = String(code).padStart(2, '0');
  return ALGERIA_WILAYAS_GEO.find(w => w.code === c);
}
