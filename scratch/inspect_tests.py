import re
import json

f = open('frontend/src/components/therapy/PsychologicalQuestionsData.js', encoding='utf-8').read()
keys = re.findall(r"^\s*['\"]([A-Z0-9\-_]+)['\"]\s*:\s*\{", f, re.M)
print("Standardized scales in PsychologicalQuestionsData:", keys)

catalog = json.load(open('backend/database/data/clinical_tests_catalog.json', encoding='utf-8'))
print(f"Total tests in catalog.json: {len(catalog)}")
print("Sample catalog codes:", [c['code'] for c in catalog[:15]])
