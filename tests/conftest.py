"""
Pytest configuration for TARANG backend test suites.
Ensures backend directory and modules are available on sys.path.
"""
import os
import sys

_ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_BACKEND_DIR = os.path.join(_ROOT_DIR, "backend")

for path in [_BACKEND_DIR, _ROOT_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)
