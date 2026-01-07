import re
import json

def clean_text(text: str) -> str:
    text = text.replace('\n', ' ')
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
    text = re.sub(r'([:])(\w)', r'\1 \2', text)
    return " ".join(text.split())

def detect_document_type(text: str) -> str:
    resume_keywords = ['experience', 'education', 'skills', 'summary', 'projects']
    text_lower = text.lower()
    matches = sum(1 for keyword in resume_keywords if keyword in text_lower)
    return "resume" if matches >= 2 else "general_document"

def extract_resume_data(text: str):
    extracted = []
    cleaned_text = clean_text(text)
    
    # Email
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, cleaned_text)
    if emails:
        email = emails[0]
        if email.startswith("pe"): email = email[2:]
        extracted.append({"label": "Email", "value": email})
        
    # Phone
    phone_pattern = r'(?:\+91[\-\s]?)?[6-9]\d{9}'
    phones = re.findall(phone_pattern, cleaned_text)
    if phones:
        extracted.append({"label": "Phone", "value": phones[0]})
        
    # Skills
    skills_found = set()
    tech_stack = ['python', 'java', 'javascript', 'react', 'node', 'sql', 'aws', 'docker', 'git']
    text_lower = cleaned_text.lower()
    for tech in tech_stack:
        if tech in text_lower:
            skills_found.add(tech.title())
            
    if skills_found:
        extracted.append({"label": "Key Skills", "value": ", ".join(sorted(list(skills_found)))})
    else:
        extracted.append({"label": "Skills", "value": "None detected"})

    return json.dumps(extracted)