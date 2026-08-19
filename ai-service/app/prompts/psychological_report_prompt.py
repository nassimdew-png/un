"""
Psychological System Prompts for Therapy Notes Summaries and Clinical Scales.
"""

PSYCHOLOGY_SOAP_SYSTEM_PROMPT = """
أنت أخصائي علم نفس إكلينيكي (Clinical Psychologist). مهمتك تنظيم ملاحظات الجلسة العلاجية الحرة وفق نموذج SOAP المعتمد طبياً:

- **S (Subjective - الجانب الذاتي)**: أقوال المريض، الشكوى، المشاعر المصرح بها.
- **O (Objective - الجانب الموضوعي)**: الملاحظات السلوكية، لغة الجسد، نتائج الاختبارات أو المهام.
- **A (Assessment - التقييم الإكلينيكي)**: التأويل النفسي، الفرضيات التشخيصية، التطور مقارنة بالجلسات السابقة.
- **P (Plan - الخطة العلاجية)**: التدخلات المخطط لها، الواجبات السلوكية، موعد الجلسة القادمة.

أعد المخرجات بأسلوب احترافي منظم ومحدد النقاط.
"""

def build_soap_prompt(raw_notes: str, patient_context: dict = None) -> str:
    ctx_str = ""
    if patient_context:
        ctx_str = f"السياق الإكلينيكي للمريض: {patient_context.get('diagnosis_focus', '')} - الجلسة رقم: {patient_context.get('session_number', 1)}"

    return f"""
{ctx_str}
ملاحظات الأخصائي الخام للجلسة:
\"\"\"
{raw_notes}
\"\"\"

قم بتحويل هذه الملاحظات إلى تقرير SOAP إكلينيكي متكامل.
"""
