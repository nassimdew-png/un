import json

catalog = json.load(open('backend/database/data/clinical_tests_catalog.json', encoding='utf-8'))
print(f"Loaded {len(catalog)} tests from clinical_tests_catalog.json")

def map_test(item):
    cat = item.get('category', '')
    code = (item.get('code') or '').upper()
    title_ar = item.get('title_ar') or code
    title_fr = item.get('title_fr') or code
    desc = item.get('description', '')
    age_str = item.get('age_range', '')
    
    # Specialty
    if cat in ['orthophony', 'orthophonie', 'fluency', 'speech']:
        specialty = 'orthophonie'
    elif cat in ['psychomotricite', 'psychomotricity']:
        specialty = 'psychomotricite'
    else:
        specialty = 'psychologie_clinique'
        
    # Scoring type
    if any(k in code for k in ['WISC', 'WAIS', 'WPPSI', 'RAVEN', 'NEMI', 'QIT', 'MATRICES']):
        scoring_type = 'standard_iq_indices'
    elif any(k in code for k in ['CAT', 'TAT', 'RORSCHACH', 'BONHOMME', 'FAMILLE', 'PATTE', 'SCENO', 'PROJECTIF']):
        scoring_type = 'projective_qualitative'
    elif any(k in code for k in ['ALOUETTE', 'ALOU-R', 'D2', 'STROOP', 'DO80', 'SSI', 'SPEED']):
        scoring_type = 'percentile_speed'
    else:
        scoring_type = 'standard_score'
        
    # Target domain
    if any(k in code for k in ['WISC', 'WAIS', 'WPPSI', 'RAVEN', 'NEMI']) or cat == 'intelligence':
        target_domain = 'intelligence_cognition'
    elif any(k in code for k in ['ALOU', 'L2MA', 'NEEL', 'LECTURE', 'DYSLEXI']):
        target_domain = 'langage_ecrit_lecture'
    elif any(k in code for k in ['ZAREKI', 'CALCUL', 'DYSCALCULI']):
        target_domain = 'calcul_dyscalculie'
    elif any(k in code for k in ['MCHAT', 'M-CHAT', 'CARS', 'VINELAND', 'ADOS', 'ADIR', 'AUTIS', 'TSA']) or cat == 'autism':
        target_domain = 'autisme_developpement'
    elif any(k in code for k in ['BDI', 'PHQ', 'GAD', 'STAI', 'RCMAS', 'R-CMAS', 'HAM', 'DASS', 'DEPRESS', 'ANXIET']) or cat == 'psychiatry':
        target_domain = 'anxiete_depression'
    elif any(k in code for k in ['CAT', 'TAT', 'RORSCHACH', 'MMPI', 'PROJECTIF', 'DESSIN', 'PATTE', 'SCENO']):
        target_domain = 'personnalite_projectif'
    elif any(k in code for k in ['D2', 'STROOP', 'CMS', 'MEM', 'WMS', 'TDAH', 'ADHD', 'ATTENTION', 'ASRS', 'SNAP']):
        target_domain = 'attention_memoire'
    elif any(k in code for k in ['DO80', 'MT86', 'APHA', 'BDAE', 'HDAE', 'APHASIE']):
        target_domain = 'aphasie'
    elif cat in ['orthophony', 'orthophonie', 'fluency', 'speech']:
        target_domain = 'langage_oral'
    else:
        target_domain = 'intelligence_cognition' if specialty == 'psychologie_clinique' else 'langage_oral'
        
    # Age brackets
    brackets = []
    if any(w in age_str for w in ['0', '1', '2', '3', 'مبكر', 'رضع', 'سنتين']):
        brackets.append('0_3_infant')
    if any(w in age_str for w in ['3', '4', '5', '6', 'روضة', 'ما قبل']):
        brackets.append('3_6_preschool')
    if any(w in age_str for w in ['6', '7', '8', '9', '10', '11', '12', 'مدرس', 'تمدرس', 'أطفال']):
        brackets.append('6_12_school')
    if any(w in age_str for w in ['12', '13', '14', '15', '16', '17', '18', 'مراهق']):
        brackets.append('12_18_teen')
    if any(w in age_str for w in ['18', 'بالغ', 'راشد', 'كبار', 'فما فوق', 'سنوات فما فوق']):
        brackets.append('18_plus_adult')
    if not brackets:
        brackets = ['6_12_school', '12_18_teen', '18_plus_adult']
        
    return {
        'id': item.get('id') or code.lower(),
        'code': code,
        'name_ar': title_ar,
        'name_fr': title_fr,
        'short_desc_ar': desc,
        'author_reference': item.get('source') or 'معيار سريري وطني مقنن 🇩🇿',
        'specialty': specialty,
        'category': cat,
        'category_label': item.get('category_label', ''),
        'scoring_type': scoring_type,
        'target_domain': target_domain,
        'age_range': age_str,
        'age_brackets': brackets,
        'duration': item.get('duration', ''),
        'cutoff': item.get('cutoff', ''),
        'dimensions': item.get('dimensions', []),
        'color': item.get('color', 'from-indigo-500 to-purple-600'),
        'has_red_alert': bool(item.get('has_red_alert') or any(k in code for k in ['BDI', 'PHQ', 'HAM-D'])),
        'self_administered': bool(item.get('self_administered', True)),
    }

mapped = [map_test(t) for t in catalog]
print(f"Successfully mapped {len(mapped)} tests")
from collections import Counter
print("Specialties:", Counter(m['specialty'] for m in mapped))
print("Scoring types:", Counter(m['scoring_type'] for m in mapped))
print("Target domains:", Counter(m['target_domain'] for m in mapped))
