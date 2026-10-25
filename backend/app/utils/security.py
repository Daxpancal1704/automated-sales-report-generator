import re
import os
import uuid
from typing import Any

# Maximum file upload size: 15 MB
MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}

def sanitize_filename(filename: str) -> str:
    """Sanitize uploaded file name to avoid directory traversal and unsafe characters."""
    base = os.path.basename(filename)
    clean = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', base)
    if not clean or clean.startswith('.'):
        clean = f"upload_{uuid.uuid4().hex[:8]}{os.path.splitext(base)[1]}"
    return clean

def sanitize_for_spreadsheet(value: Any) -> Any:
    """
    Prevent CSV / Excel Formula Injection (CSV Injection).
    If a string starts with '=', '+', '-', '@', tab, or carriage return,
    prefix it with a single quote so spreadsheet engines treat it as text.
    """
    if isinstance(value, str):
        if value and value[0] in ('=', '+', '-', '@', '\t', '\r'):
            return f"'{value}"
    return value

def generate_session_id() -> str:
    """Generate a cryptographically safe unique session token."""
    return str(uuid.uuid4())
