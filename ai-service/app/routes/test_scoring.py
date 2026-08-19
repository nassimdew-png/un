from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/tests", tags=["Psychometric Test Scoring"])

class ScoreTestRequest(BaseModel):
    test_type: str = Field(..., example="BDI-II", description="Code of the clinical scale (BDI-II, HAM-A, M-CHAT, etc.)")
    answers: List[int] = Field(..., example=[0, 2, 1, 3, 0, 1])
    patient_age: Optional[int] = None

class ScoreTestResponse(BaseModel):
    test_type: str
    total_score: int
    max_possible_score: int
    severity: str
    interpretation_ar: str
    clinical_alerts: List[str] = []

@router.post("/score", response_model=ScoreTestResponse)
async def score_psychometric_test(payload: ScoreTestRequest):
    test_code = payload.test_type.upper().strip()
    answers = payload.answers
    total_score = sum(answers)

    if test_code in ["BDI-II", "BDI2", "BECK"]:
        max_score = 63
        alerts = []
        # Item 9 in BDI-II assesses suicidal ideation (0-3)
        if len(answers) >= 9 and answers[8] >= 2:
            alerts.append("تنبيه أمان سريري عاجل: إجابة مرتفعة على بند التفكير في إيذاء النفس / الانتحار")

        if total_score <= 13:
            severity = "Minimal Depression (أعراض اكتئابية طفيفة أو طبيعية)"
            interp = "الدرجة الكلية تقع ضمن النطاق الطبيعي دون مؤشرات دالة على اكتئاب إكلينيكي."
        elif total_score <= 19:
            severity = "Mild Depression (اكتئاب خفيف)"
            interp = "وجود مؤشرات لأعراض اكتئابية خفيفة تستدعي المتابعة النفسية الإرشادية."
        elif total_score <= 28:
            severity = "Moderate Depression (اكتئاب متوسط)"
            interp = "أعراض اكتئابية متوسطة الشدة، يُنصح بالتدخل العلاجي السلوكي المعرفي (CBT)."
        else:
            severity = "Severe Depression (اكتئاب حاد / شديد)"
            interp = "درجة مرتفعة تشير إلى نوبة اكتئابية حادة تستلزم تقييماً ومتابعة طبية ونفسية مكثفة."

        return ScoreTestResponse(
            test_type="BDI-II (Beck Depression Inventory)",
            total_score=total_score,
            max_possible_score=max_score,
            severity=severity,
            interpretation_ar=interp,
            clinical_alerts=alerts
        )

    elif test_code in ["HAM-A", "HAMA", "ANXIETY"]:
        max_score = 56
        if total_score <= 17:
            severity = "Mild Anxiety (قلق خفيف)"
            interp = "مستوى قلق طبيعي إلى خفيف."
        elif total_score <= 24:
            severity = "Moderate Anxiety (قلق متوسط)"
            interp = "مستوى قلق متوسط الشدة يستوجب جلسات استرخاء وإدارة التوتر."
        else:
            severity = "Severe Anxiety (قلق شديد)"
            interp = "مستوى قلق مرتفع يعيق الأداء اليومي."

        return ScoreTestResponse(
            test_type="HAM-A (Hamilton Anxiety Rating Scale)",
            total_score=total_score,
            max_possible_score=max_score,
            severity=severity,
            interpretation_ar=interp,
            clinical_alerts=[]
        )

    else:
        # Generic scale handler
        return ScoreTestResponse(
            test_type=payload.test_type,
            total_score=total_score,
            max_possible_score=len(answers) * 3,
            severity="Completed",
            interpretation_ar=f"تم تسجيل مجموع درجات كلي: {total_score} من إجمالي {len(answers)} أسئلة.",
            clinical_alerts=[]
        )
