import sys
import json
import fitz  # PyMuPDF
from normalizer import normalize_text
import os

# Configurable thresholds
OCR_REQUIRED_CHAR_THRESHOLD = int(os.environ.get("PDF_OCR_CHAR_THRESHOLD", "50"))
OCR_REQUIRED_WORD_THRESHOLD = int(os.environ.get("PDF_OCR_WORD_THRESHOLD", "10"))

def calculate_word_count(text: str) -> int:
    return len([w for w in text.split() if w.strip()])

def extract_pdf(file_path: str):
    result = {
        "status": "FAILED",
        "filename": os.path.basename(file_path),
        "pageCount": 0,
        "pages": []
    }

    try:
        if not os.path.exists(file_path):
            result["error"] = "File not found"
            print(json.dumps(result))
            sys.exit(1)

        doc = fitz.open(file_path)
        result["pageCount"] = len(doc)

        ocr_required_pages = 0
        text_available_pages = 0

        for page_num in range(len(doc)):
            page = doc[page_num]
            # Use basic text extraction, try to preserve layout loosely
            raw_text = page.get_text("text")
            
            normalized_text = normalize_text(raw_text)
            char_count = len(normalized_text)
            word_count = calculate_word_count(normalized_text)

            page_status = "TEXT_AVAILABLE"
            if char_count < OCR_REQUIRED_CHAR_THRESHOLD and word_count < OCR_REQUIRED_WORD_THRESHOLD:
                page_status = "OCR_REQUIRED"
                ocr_required_pages += 1
            else:
                text_available_pages += 1

            result["pages"].append({
                "pageNumber": page_num + 1,
                "text": normalized_text,
                "characterCount": char_count,
                "wordCount": word_count,
                "status": page_status
            })

        doc.close()

        # Determine overall document status
        if text_available_pages == 0 and result["pageCount"] > 0:
            result["status"] = "OCR_REQUIRED"
        elif ocr_required_pages > 0:
            result["status"] = "PARTIAL"
        else:
            result["status"] = "SUCCESS"

        # Print JSON to stdout for Node.js to consume
        print(json.dumps(result))

    except Exception as e:
        result["status"] = "FAILED"
        result["error"] = str(e)
        print(json.dumps(result))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "FAILED", "error": "No file path provided"}))
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    extract_pdf(pdf_path)
