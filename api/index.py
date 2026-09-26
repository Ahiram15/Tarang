"""
TARANG Vercel Serverless Function Entrypoint
===========================================
Exports the FastAPI application instance for Vercel Python runtime.
"""
import os
import sys

_API_DIR = os.path.dirname(os.path.abspath(__file__))
_ROOT_DIR = os.path.dirname(_API_DIR)
_BACKEND_DIR = os.path.join(_ROOT_DIR, "backend")

if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)
if _ROOT_DIR not in sys.path:
    sys.path.insert(0, _ROOT_DIR)

from backend.api import app
