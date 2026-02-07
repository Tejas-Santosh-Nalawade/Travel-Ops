#!/usr/bin/env python3
"""
Quick verification script to check if the server can start.
Run this after installing dependencies.
"""
import sys
import importlib.util

print("=" * 60)
print("  AI Orchestrator - Installation Verification")
print("=" * 60)
print()

# Check Python version
print("🐍 Python Version:")
print(f"   {sys.version}")
if sys.version_info < (3, 9):
    print("   ❌ ERROR: Python 3.9+ required!")
    sys.exit(1)
print("   ✅ Python version OK")
print()

# Check required modules
required_modules = [
    'fastapi',
    'uvicorn',
    'pydantic',
    'geopy',
    'supabase',
]

print("📦 Checking Dependencies:")
all_ok = True
for module_name in required_modules:
    spec = importlib.util.find_spec(module_name)
    if spec is None:
        print(f"   ❌ {module_name} - NOT INSTALLED")
        all_ok = False
    else:
        print(f"   ✅ {module_name} - installed")

print()

if not all_ok:
    print("❌ Missing dependencies!")
    print()
    print("To fix, run:")
    print("   pip install -r requirements.txt")
    print()
    sys.exit(1)

# Try importing main modules
print("🔍 Checking Imports:")
try:
    from models.schemas import TravelRequest
    print("   ✅ models.schemas - OK")
except ImportError as e:
    print(f"   ❌ models.schemas - FAILED: {e}")
    all_ok = False

try:
    from agents.orchestrator import TravelOrchestratorAgent
    print("   ✅ agents.orchestrator - OK")
except ImportError as e:
    print(f"   ❌ agents.orchestrator - FAILED: {e}")
    all_ok = False

try:
    from api.routes import app
    print("   ✅ api.routes - OK")
except ImportError as e:
    print(f"   ❌ api.routes - FAILED: {e}")
    all_ok = False

print()

if all_ok:
    print("=" * 60)
    print("  ✅ ALL CHECKS PASSED!")
    print("=" * 60)
    print()
    print("You're ready to start the server:")
    print("   python main.py")
    print()
    print("Or visit:")
    print("   http://localhost:8000/docs")
    print()
else:
    print("=" * 60)
    print("  ❌ SOME CHECKS FAILED")
    print("=" * 60)
    print()
    print("Please fix the errors above and try again.")
    print()
    sys.exit(1)
