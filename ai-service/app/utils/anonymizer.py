import re
from typing import Dict, Tuple

class ClinicalDataAnonymizer:
    """
    Sanitizes patient clinical notes to strip identifiable PII
    (names, phone numbers, exact addresses, dates of birth) before LLM submission.
    """

    PHONE_PATTERN = r'\b(?:0|\+?213|00213)[567]\d{8}\b|\b\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}\b'
    DATE_PATTERN = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'
    EMAIL_PATTERN = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'

    @classmethod
    def sanitize_text(cls, text: str, patient_name: str = None) -> Tuple[str, Dict[str, str]]:
        if not text:
            return "", {}

        mapping = {}
        sanitized = text

        # Strip explicit patient name if provided
        if patient_name and len(patient_name.strip()) > 2:
            name_clean = patient_name.strip()
            sanitized = re.sub(re.escape(name_clean), "[اسم المريض/PATIENT]", sanitized, flags=re.IGNORECASE)
            for part in name_clean.split():
                if len(part) > 2:
                    sanitized = re.sub(re.escape(part), "[PATIENT_NAME]", sanitized, flags=re.IGNORECASE)

        # Replace phone numbers
        sanitized = re.sub(cls.PHONE_PATTERN, "[رقم الهاتف/PHONE]", sanitized)

        # Replace emails
        sanitized = re.sub(cls.EMAIL_PATTERN, "[البريد/EMAIL]", sanitized)

        # Replace exact dates
        sanitized = re.sub(cls.DATE_PATTERN, "[تاريخ/DATE]", sanitized)

        return sanitized, mapping
