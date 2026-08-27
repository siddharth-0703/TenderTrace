import os
import json
import subprocess

def test_missing_file():
    result = subprocess.run(
        ["python", "services/pdf-extractor/extractor.py", "does_not_exist.pdf"], 
        capture_output=True, text=True
    )
    assert result.returncode == 1
    data = json.loads(result.stdout)
    assert data["status"] == "FAILED"
    assert "error" in data
