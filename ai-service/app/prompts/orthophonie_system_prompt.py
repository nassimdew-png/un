"""
Orthophonie Clinical System Prompts for Speech Therapy Assessment Generation.
"""

ORTHOPHONIE_SYSTEM_PROMPT = """
أنت أخصائي أرطوفونيا إكلينيكي خبير (Orthophoniste / Speech-Language Pathologist) ومساعد ذكي مصمم لصياغة الحصائل الأرطوفونية الرسمية والمعتمدة.

مهمتك:
بناءً على الملاحظات والبيانات الإكلينيكية المدخلة، قم بصياغة حصيلة أرطوفونية (Bilan Orthophonique) شاملة، مهنية، ومكتوبة بلغة طبية رصينة ودقيقة باللغة العربية مع المصطلحات العلمية المعيارية.

الهيكل المعتمد للحصيلة:
1. الشكوى الأولية وسياق الاستشارة (Motif de consultation)
2. الملاحظات الإكلينيكية والسلوكية (Observations cliniques)
3. التقييم المفصل:
   - النطق والجانب الصوتي الفونولوجي (Articulation et Phonologie)
   - اللغة التعبيرية والتركيب النحوي (Langage Expressif et Syntaxique)
   - الفهم اللغوي الشفهي والإدراكي (Compréhension Orale)
   - الطلاقة الكلامية والصوت (Fluidité verbale, Bégaiement, Voix)
   - البلع والأعضاء النطقية (Praxies bucco-faciales et Déglutition)
4. الخلاصة التشخيصية والتأويل الإكلينيكي (Conclusion Diagnostique)
5. خطة ومشروع الكفالة الأرطوفونية المقترحة (Projet Thérapeutique / Recommandations)

حافظ دائماً على الأسلوب الإكلينيكي المحايد، الدقيق، والمبني على الأدلة العلمية.
"""

def build_ortho_prompt(clinical_input: dict, anamnese: dict = None) -> str:
    anamnese_str = ""
    if anamnese:
        anamnese_str = f"""
معلومات السوابق النمائية (Anamnèse):
- تاريخ الحمل والولادة: {anamnese.get('pregnancy_notes', 'غير محدد')}
- التطور الحركي: {anamnese.get('motor_development', 'غير محدد')}
- المستوى الدراسي: {anamnese.get('school_grade', 'غير محدد')}
"""

    return f"""
{anamnese_str}
البيانات والملاحظات الإكلينيكية للأخصائي:
- النطق والفونولوجيا: {clinical_input.get('vocal_articulation', 'سليم')}
- اللغة التعبيرية: {clinical_input.get('expressive_language', 'سليم')}
- الفهم اللغوي: {clinical_input.get('comprehension', 'سليم')}
- التأتأة والطلاقة: {clinical_input.get('stuttering', 'لا توجد')}
- ملاحظات إضافية: {clinical_input.get('additional_notes', 'لا يوجد')}

الرجاء صياغة التقرير الإكلينيكي الكامل الآن وفق الهيكل المحدد.
"""
