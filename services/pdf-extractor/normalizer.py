import re

def normalize_text(text: str) -> str:
    """
    Perform safe text normalizations that preserve meaning:
    - Normalizes CRLF -> LF
    - Removes NULL characters
    - Normalizes excessive whitespace (but preserves paragraph boundaries)
    
    Does NOT remove:
    - Currency symbols (₹, $, etc.)
    - Dates (DD/MM/YYYY)
    - Punctuation critical for clauses
    - Formatting elements that could signify lists or hierarchy
    """
    if not text:
        return ""
        
    # Replace CRLF with LF
    text = text.replace('\r\n', '\n')
    
    # Remove NULL characters which cause issues in JSON and databases
    text = text.replace('\x00', '')
    
    # Normalize multiple spaces (but preserve single newlines or multiple newlines)
    # We replace 3+ spaces with 2 spaces to maintain visual gaps if any, 
    # but regular spaces are just kept to avoid destroying table-like layouts entirely.
    # Actually, a safer approach is to leave spacing mostly intact for now,
    # except reducing huge gaps that PyMuPDF sometimes generates for justified text.
    text = re.sub(r'[ \t]{4,}', '    ', text)
    
    # Ensure Unicode consistency (e.g. standardizing quotes or dashes if needed, 
    # but for now we just keep the raw text as much as possible as per the prompt).
    return text.strip()
