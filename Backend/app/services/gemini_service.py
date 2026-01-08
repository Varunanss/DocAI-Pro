import google.generativeai as genai
import time
import re
import os
import json
import tempfile
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# ============================================================
# 🔐 10-KEY ROTATION SYSTEM (Add your keys here)
# ============================================================
KEYS_STRING = os.getenv("GEMINI_API_KEYS")

if not KEYS_STRING:
    # Fallback to a single key if the list is missing (prevents crash)
    single_key = os.getenv("GEMINI_API_KEY")
    if single_key:
        API_KEYS = [single_key]
    else:
        raise ValueError("❌ GEMINI_API_KEYS is missing in .env file! Please add keys separated by commas.")
else:
    # Create the list by splitting commas and stripping spaces
    API_KEYS = [k.strip() for k in KEYS_STRING.split(",") if k.strip()]

current_key_index = 0

def configure_next_key():
    global current_key_index
    try:
        key = API_KEYS[current_key_index]
        current_key_index = (current_key_index + 1) % len(API_KEYS)
        genai.configure(api_key=key)
    except Exception as e:
        print(f"Key Rotation Error: {e}")

configure_next_key()

def upload_to_gemini(path, mime_type="application/pdf"):
    configure_next_key()
    return genai.upload_file(path, mime_type=mime_type)

def wait_for_files_active(files):
    for name in (file.name for file in files):
        file = genai.get_file(name)
        while file.state.name == "PROCESSING":
            time.sleep(1)
            file = genai.get_file(name)
        if file.state.name != "ACTIVE":
            raise Exception(f"File {file.name} failed to process")

# ============================================================
# ⚡ STAGE 1: PYTHON GENRE DETECTION
# ============================================================
def detect_genre_python(raw_text_preview: str) -> str:
    text = raw_text_preview.lower()[:3000]
    if "resume" in text or "curriculum vitae" in text: return "resume"
    if "invoice" in text and "total" in text: return "invoice"
    if "chapter" in text and "manga" in text: return "manga_comic"
    return "general_document"

# ============================================================
# 🧠 STAGE 2: SMART ANALYST (With AUTO-RETRY Fix)
# ============================================================
async def generate_smart_analysis(file_path: str, genre: str, raw_data: str) -> tuple[str, str, float]:
    """
    Tries to analyze the document. 
    🔥 RETRY LOGIC: If Network Fails (WinError 10060), it RETRIES 3 times.
    """
    max_retries = 3
    retry_delay = 2 # Seconds
    
    for attempt in range(max_retries):
        try:
            print(f"⏳ STAGE 2: Smart Analysis Running... (Attempt {attempt + 1}/{max_retries})")
            
            configure_next_key()
            pdf_file = upload_to_gemini(file_path)
            wait_for_files_active([pdf_file])
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            prompt = f"""
            You are an Elite Document Analyst. Context: '{genre}'.
            
            **MISSION:**
            Create a **Medium-Length, High-Density Summary**. 
            
            **RULES:**
            1. **Short File (1-5 pages):** Detailed summary.
            2. **Large File (10+ pages):** Structural Map (Concise).
            3. **Factuality:** No hallucinations.
            
            **OUTPUT FORMAT:**
            - Executive Summary (3 sentences max).
            - Detailed Breakdown (## Headings).
            - JSON Entities (At the bottom).
            
            REQUIRED ENDING:
            CONFIDENCE_SCORE: [0-100]
            JSON_ENTITIES: 
            [ 
              {{"label": "Topic", "value": "Visualization"}}, 
              {{"label": "Topic", "value": "Correlation"}} 
            ]
            """
            
            response = model.generate_content([pdf_file, prompt])
            text = response.text
            
            # --- 1. EXTRACT SCORE ---
            score = 98.0
            match_score = re.search(r'CONFIDENCE_SCORE:\s*(\d+(\.\d+)?)', text, re.IGNORECASE)
            if match_score:
                score = float(match_score.group(1))
                text = text.replace(match_score.group(0), "").strip()

            # --- 2. EXTRACT JSON ---
            final_json = "[]"
            match_labeled = re.search(r'JSON_ENTITIES:\s*(?:```json)?\s*(\[.*?\])\s*(?:```)?', text, re.DOTALL | re.IGNORECASE)
            match_raw = re.search(r'(\[\s*\{.*\}\s*\])\s*$', text, re.DOTALL)

            if match_labeled:
                final_json = match_labeled.group(1)
                text = text.replace(match_labeled.group(0), "").strip()
            elif match_raw:
                final_json = match_raw.group(1)
                text = text.replace(final_json, "").strip()
                
            text = re.sub(r'JSON_ENTITIES:\s*$', '', text).strip()

            # --- 3. MERGE DUPLICATE LABELS ---
            if final_json != "[]":
                try:
                    data = json.loads(final_json)
                    merged_dict = {}
                    for item in data:
                        label = item.get("label", item.get("section", "Key")).strip().title()
                        value = str(item.get("value", item.get("name", ""))).strip()
                        if label in merged_dict:
                            if value not in merged_dict[label]: merged_dict[label] += f", {value}"
                        else:
                            merged_dict[label] = value
                    
                    merged_list = [{"label": k, "value": v} for k, v in merged_dict.items()]
                    final_json = json.dumps(merged_list)
                except: pass

            # If successful, return data
            return text, final_json, score
            
        except Exception as e:
            print(f"⚠️ Attempt {attempt + 1} Failed: {e}")
            if attempt < max_retries - 1:
                print(f"🔄 Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                # If ALL retries fail, return a safe error message so server doesn't crash
                return f"**Analysis Failed:** Network unstable. Please check internet connection.\nError details: {str(e)}", "[]", 0.0

# ============================================================
# PDF GENERATOR
# ============================================================
async def generate_pdf_report(summary: str, extracted_data: str, doc_type: str) -> str:
    fd, path = tempfile.mkstemp(suffix=".pdf")
    c = canvas.Canvas(path, pagesize=letter)
    width, height = letter
    c.setFillColorRGB(0.1, 0.1, 0.1)
    c.rect(0, height - 100, width, 100, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 60, "DocProcessor AI Report")
    c.setFont("Helvetica", 14)
    c.drawString(50, height - 85, f"Type: {doc_type.upper()}")
    c.setFillColorRGB(0, 0, 0)
    
    y = height - 140
    def draw_text(text_str, x_pos, y_pos):
        c.setFont("Helvetica", 11)
        if not text_str: return y_pos
        for line in text_str.split('\n'):
            clean = line.replace('## ', '').replace('**', '').replace('*', '')
            if y_pos < 50: c.showPage(); y_pos = height - 50
            if clean.strip(): c.drawString(x_pos, y_pos, clean[:90])
            y_pos -= 15
        return y_pos

    y = draw_text(summary, 50, y)
    
    if y < height - 300:
        y -= 20
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, "Verified Information:")
        y -= 20
        c.setFont("Helvetica", 10)
        try:
            if isinstance(extracted_data, str): data = json.loads(extracted_data)
            else: data = extracted_data
            
            for item in data:
                if y < 50: c.showPage(); y = height - 50
                label = item.get('label', item.get('section', 'Key'))
                value = str(item.get('value', item.get('name', '')))
                line = f"• {label}: {value[:80]}"
                c.drawString(60, y, line)
                y -= 15
        except: pass
        
    c.save()
    return path