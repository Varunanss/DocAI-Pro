import pypdf
import json

def extract_text_from_pdf(file_path: str) -> str:
    """Extracts raw text from PDF"""
    text = ""
    try:
        reader = pypdf.PdfReader(file_path)
        for page in reader.pages:
            content = page.extract_text()
            if content:
                text += content + "\n"
    except Exception as e:
        raise Exception(f"Error reading PDF: {str(e)}")
    return text

def get_page_count(file_path: str) -> int:
    try:
        reader = pypdf.PdfReader(file_path)
        return len(reader.pages)
    except:
        return 0

def extract_generic_data(text: str):
    """Fallback extraction for non-resumes"""
    # Simply take the first few lines as a preview
    preview = text[:500].replace('\n', ' ')
    return json.dumps([{"label": "Document Preview", "value": preview + "..."}])