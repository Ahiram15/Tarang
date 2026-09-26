"""
TARANG API Root Proxy Shim
===========================
Redirects calls to the modular backend package located in backend/api.py.
Enables backward-compatible invocations such as `uvicorn api:app`.
"""
import os
import sys

_ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.join(_ROOT_DIR, "backend")

if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)
if _ROOT_DIR not in sys.path:
    sys.path.insert(0, _ROOT_DIR)

from backend.api import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api:app", host="0.0.0.0", port=8000, reload=True)
