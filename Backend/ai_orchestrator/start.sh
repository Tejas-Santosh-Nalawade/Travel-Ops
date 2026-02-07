#!/bin/bash

# Quick Start Script for AI Orchestrator
# This script sets up and runs the AI Orchestrator server

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║         TravelOps AI Orchestrator - Quick Start             ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check Python version
echo "🔍 Checking Python version..."
python_version=$(python --version 2>&1 | grep -oP '\d+\.\d+')
if (( $(echo "$python_version < 3.9" | bc -l) )); then
    echo "❌ Error: Python 3.9 or higher is required"
    echo "   Current version: $(python --version)"
    exit 1
fi
echo "✅ Python version OK: $(python --version)"
echo ""

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi
echo ""

# Activate virtual environment
echo "🔄 Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    source venv/Scripts/activate
else
    # Linux/Mac
    source venv/bin/activate
fi
echo ""

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt --quiet
echo "✅ Dependencies installed"
echo ""

# Create .env file if not exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created (edit if needed)"
else
    echo "✅ .env file already exists"
fi
echo ""

# Start the server
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                     🚀 STARTING SERVER                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Server will be available at:"
echo "  • API: http://localhost:8000"
echo "  • Docs: http://localhost:8000/docs"
echo "  • ReDoc: http://localhost:8000/redoc"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python main.py
